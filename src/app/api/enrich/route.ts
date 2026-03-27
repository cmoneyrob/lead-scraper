import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUrl } from '@/lib/enrichment/fetcher';
import { parseHtml } from '@/lib/enrichment/parser';

interface EnrichBody {
  lead_id: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: EnrichBody;
  try {
    body = await request.json() as EnrichBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.lead_id || typeof body.lead_id !== 'string') {
    return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
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

  if (!lead.url) {
    return NextResponse.json({ error: 'Lead has no URL to enrich' }, { status: 400 });
  }

  try {
    const fetchResult = await fetchUrl(lead.url);
    const enrichmentData = parseHtml(fetchResult.html, lead.url);

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        enrichment_data: enrichmentData as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.lead_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ lead: updatedLead, enrichment: enrichmentData }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrichment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
