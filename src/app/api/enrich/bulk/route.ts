import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUrl } from '@/lib/enrichment/fetcher';
import { parseHtml } from '@/lib/enrichment/parser';

interface BulkEnrichBody {
  lead_ids: string[];
}

interface EnrichResultItem {
  lead_id: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: BulkEnrichBody;
  try {
    body = await request.json() as BulkEnrichBody;
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

  if (leadsError) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  const leadsMap = new Map(leads?.map((l) => [l.id, l]) ?? []);
  const results: EnrichResultItem[] = [];

  for (const leadId of body.lead_ids) {
    const lead = leadsMap.get(leadId);
    if (!lead) {
      results.push({ lead_id: leadId, success: false, error: 'Lead not found' });
      continue;
    }

    if (!lead.url) {
      results.push({ lead_id: leadId, success: false, error: 'Lead has no URL' });
      continue;
    }

    try {
      const fetchResult = await fetchUrl(lead.url);
      const enrichmentData = parseHtml(fetchResult.html, lead.url);

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          enrichment_data: enrichmentData as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) {
        results.push({ lead_id: leadId, success: false, error: 'Failed to update lead' });
      } else {
        results.push({ lead_id: leadId, success: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrichment failed';
      results.push({ lead_id: leadId, success: false, error: message });
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}
