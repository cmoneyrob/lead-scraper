import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runPipeline } from '@/lib/signals/pipeline';

interface EvaluateBody {
  lead_ids: string[];
  scoring_profile_id?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: EvaluateBody;
  try {
    body = await request.json() as EvaluateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.lead_ids) || body.lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids must be a non-empty array' }, { status: 400 });
  }

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .in('id', body.lead_ids)
    .eq('user_id', user.id);

  if (leadsError || !leads) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  if (leads.length === 0) {
    return NextResponse.json({ error: 'No valid leads found' }, { status: 404 });
  }

  let signalIds: string[] | undefined;
  let qualificationThreshold = 0.7;

  if (body.scoring_profile_id) {
    const { data: profile, error: profileError } = await supabase
      .from('scoring_profiles')
      .select('*')
      .eq('id', body.scoring_profile_id)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Scoring profile not found' }, { status: 404 });
    }

    signalIds = profile.signal_ids;
    qualificationThreshold = profile.qualification_threshold / 100;
  }

  let signalsQuery = supabase
    .from('signal_definitions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (signalIds && signalIds.length > 0) {
    signalsQuery = signalsQuery.in('id', signalIds);
  }

  const { data: signals, error: signalsError } = await signalsQuery;

  if (signalsError || !signals) {
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }

  if (signals.length === 0) {
    return NextResponse.json({ error: 'No active signals found' }, { status: 400 });
  }

  try {
    const evaluationResults = [];

    for (const lead of leads) {
      const pipelineResult = runPipeline(
        {
          id: lead.id,
          company_name: lead.company_name,
          domain: lead.domain,
          url: lead.url,
          title: lead.title,
          description: lead.description,
          enrichment_data: lead.enrichment_data as import('@/lib/signals/types').EnrichmentData | null,
        },
        signals,
        qualificationThreshold
      );

      // Save signal results
      for (const score of pipelineResult.scores) {
        await supabase
          .from('signal_results')
          .upsert({
            lead_id: lead.id,
            signal_definition_id: score.signalId,
            matched: score.result.matched,
            raw_score: score.result.rawScore,
            weighted_score: score.weightedScore,
            match_details: score.result.matchDetails,
            evaluated_at: new Date().toISOString(),
          }, { onConflict: 'lead_id,signal_definition_id' });
      }

      // Update lead score
      await supabase
        .from('leads')
        .update({
          total_score: pipelineResult.totalScore,
          qualified: pipelineResult.qualified,
          qualification_threshold: qualificationThreshold * 100,
          last_scored_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      evaluationResults.push({
        lead_id: lead.id,
        total_score: pipelineResult.totalScore,
        qualified: pipelineResult.qualified,
        scores: pipelineResult.scores.length,
      });
    }

    return NextResponse.json({
      evaluated: evaluationResults.length,
      results: evaluationResults,
    }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Evaluation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
