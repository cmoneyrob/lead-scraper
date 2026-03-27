import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEvaluator } from '@/lib/signals/registry';
import type { SignalEvaluationContext, EnrichmentData } from '@/lib/signals/types';

interface TestBody {
  lead_id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: TestBody;
  try {
    body = await request.json() as TestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.lead_id || typeof body.lead_id !== 'string') {
    return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
  }

  const { data: signal, error: signalError } = await supabase
    .from('signal_definitions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (signalError || !signal) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', body.lead_id)
    .eq('user_id', user.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  try {
    const evaluator = getEvaluator(signal.signal_type);

    const context: SignalEvaluationContext = {
      lead: {
        id: lead.id,
        company_name: lead.company_name,
        domain: lead.domain,
        url: lead.url,
        title: lead.title,
        description: lead.description,
        enrichment_data: lead.enrichment_data as unknown as EnrichmentData | null,
      },
      priorResults: new Map(),
    };

    const result = evaluator.evaluate(signal.config, context);

    return NextResponse.json({
      signal_id: signal.id,
      signal_name: signal.name,
      lead_id: lead.id,
      result: {
        matched: result.matched,
        raw_score: result.rawScore,
        weighted_score: result.rawScore * signal.weight,
        match_details: result.matchDetails,
      },
    }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Evaluation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
