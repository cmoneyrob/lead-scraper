import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BraveSearchClient } from '@/lib/brave/client';
import { parseBraveResults } from '@/lib/brave/parse';

interface SearchBody {
  query: string;
  country?: string;
  freshness?: 'pd' | 'pw' | 'pm' | 'py';
  count?: number;
  scoring_profile_id?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SearchBody;
  try {
    body = await request.json() as SearchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.query || typeof body.query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const searchParams: Record<string, unknown> = {
    country: body.country,
    freshness: body.freshness,
    count: body.count ?? 20,
  };

  const { data: job, error: insertError } = await supabase
    .from('search_jobs')
    .insert({
      user_id: user.id,
      query: body.query,
      search_params: searchParams,
      scoring_profile_id: body.scoring_profile_id ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !job) {
    return NextResponse.json({ error: 'Failed to create search job' }, { status: 500 });
  }

  try {
    const client = new BraveSearchClient();
    const response = await client.webSearch({
      q: body.query,
      country: body.country,
      freshness: body.freshness,
      count: body.count ?? 20,
    });

    const webResults = response.web?.results ?? [];
    const parsedLeads = parseBraveResults(webResults);

    const { data: updatedJob, error: updateError } = await supabase
      .from('search_jobs')
      .update({
        status: 'completed',
        results_count: parsedLeads.length,
        results_data: parsedLeads as unknown as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update search job' }, { status: 500 });
    }

    return NextResponse.json({ job: updatedJob, results: parsedLeads }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';

    await supabase
      .from('search_jobs')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
