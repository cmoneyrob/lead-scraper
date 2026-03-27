import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeadStatus } from '@/types/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl;
  const format = url.searchParams.get('format') ?? 'json';
  const status = url.searchParams.get('status') as LeadStatus | null;
  const qualified = url.searchParams.get('qualified');
  const tagId = url.searchParams.get('tag_id');

  if (format !== 'csv' && format !== 'json') {
    return NextResponse.json({ error: 'format must be "csv" or "json"' }, { status: 400 });
  }

  let leadIds: string[] | undefined;
  if (tagId) {
    const { data: tagLinks } = await supabase
      .from('lead_tags')
      .select('lead_id')
      .eq('tag_id', tagId);
    leadIds = tagLinks?.map((lt) => lt.lead_id) ?? [];
    if (leadIds.length === 0) {
      if (format === 'csv') {
        return new NextResponse('', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads.csv"',
          },
        });
      }
      return NextResponse.json([], { status: 200 });
    }
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (qualified !== null && qualified !== undefined) {
    query = query.eq('qualified', qualified === 'true');
  }
  if (leadIds) {
    query = query.in('id', leadIds);
  }

  const { data: leads, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  const exportLeads = leads ?? [];

  if (format === 'json') {
    return NextResponse.json(exportLeads, { status: 200 });
  }

  const csvHeaders = [
    'id', 'company_name', 'domain', 'url', 'title', 'description',
    'contact_name', 'contact_email', 'contact_phone', 'contact_linkedin',
    'status', 'pipeline_stage', 'total_score', 'qualified', 'notes',
    'created_at', 'updated_at',
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [csvHeaders.join(',')];
  for (const lead of exportLeads) {
    const row = csvHeaders.map((header) => {
      const value = (lead as Record<string, unknown>)[header];
      return escapeCSV(value);
    });
    rows.push(row.join(','));
  }

  const csv = rows.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="leads.csv"',
    },
  });
}
