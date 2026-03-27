import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

interface ImportBody {
  result_indices: number[];
}

interface ParsedResult {
  company_name: string;
  domain: string;
  url: string;
  title: string;
  description: string;
  raw_search_result: Record<string, unknown>;
}

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;

  let body: ImportBody;
  try {
    body = await request.json() as ImportBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.result_indices) || body.result_indices.length === 0) {
    return NextResponse.json({ error: 'result_indices must be a non-empty array' }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from('search_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Search job not found' }, { status: 404 });
  }

  if (!job.results_data) {
    return NextResponse.json({ error: 'No results data available for this job' }, { status: 400 });
  }

  const resultsArray = job.results_data as unknown as ParsedResult[];
  if (!Array.isArray(resultsArray)) {
    return NextResponse.json({ error: 'Invalid results data format' }, { status: 500 });
  }

  const leadsToInsert: LeadInsert[] = [];
  for (const index of body.result_indices) {
    const result = resultsArray[index];
    if (!result) {
      continue;
    }
    leadsToInsert.push({
      user_id: user.id,
      company_name: result.company_name,
      domain: result.domain,
      url: result.url,
      title: result.title,
      description: result.description,
      raw_search_result: result.raw_search_result,
    });
  }

  if (leadsToInsert.length === 0) {
    return NextResponse.json({ error: 'No valid result indices provided' }, { status: 400 });
  }

  const { data: leads, error: insertError } = await supabase
    .from('leads')
    .insert(leadsToInsert)
    .select();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create leads' }, { status: 500 });
  }

  await supabase
    .from('search_jobs')
    .update({ leads_created: (job.leads_created ?? 0) + leadsToInsert.length })
    .eq('id', jobId);

  return NextResponse.json({ leads }, { status: 201 });
}
