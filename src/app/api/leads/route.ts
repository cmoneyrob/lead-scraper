import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeadStatus, PipelineStage } from '@/types/database';

const VALID_SORT_FIELDS = ['total_score', 'created_at', 'company_name'] as const;
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl;
  const status = url.searchParams.get('status') as LeadStatus | null;
  const pipelineStage = url.searchParams.get('pipeline_stage') as PipelineStage | null;
  const qualified = url.searchParams.get('qualified');
  const minScore = url.searchParams.get('min_score');
  const maxScore = url.searchParams.get('max_score');
  const tagId = url.searchParams.get('tag_id');
  const search = url.searchParams.get('search');
  const sortBy = url.searchParams.get('sort_by') ?? 'created_at';
  const sortOrder = url.searchParams.get('sort_order') ?? 'desc';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') ?? '25', 10)));

  const validSortBy = (VALID_SORT_FIELDS as readonly string[]).includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = (VALID_SORT_ORDERS as readonly string[]).includes(sortOrder) ? sortOrder : 'desc';

  let leadIds: string[] | undefined;
  if (tagId) {
    const { data: tagLinks, error: tagError } = await supabase
      .from('lead_tags')
      .select('lead_id')
      .eq('tag_id', tagId);

    if (tagError) {
      return NextResponse.json({ error: 'Failed to filter by tag' }, { status: 500 });
    }
    leadIds = tagLinks?.map((lt) => lt.lead_id) ?? [];
    if (leadIds.length === 0) {
      return NextResponse.json({ leads: [], total: 0, page, per_page: perPage }, { status: 200 });
    }
  }

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (status) {
    query = query.eq('status', status);
  }
  if (pipelineStage) {
    query = query.eq('pipeline_stage', pipelineStage);
  }
  if (qualified !== null) {
    query = query.eq('qualified', qualified === 'true');
  }
  if (minScore) {
    query = query.gte('total_score', parseFloat(minScore));
  }
  if (maxScore) {
    query = query.lte('total_score', parseFloat(maxScore));
  }
  if (leadIds) {
    query = query.in('id', leadIds);
  }
  if (search) {
    query = query.or(`company_name.ilike.%${search}%,domain.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const offset = (page - 1) * perPage;
  query = query
    .order(validSortBy, { ascending: validSortOrder === 'asc' })
    .range(offset, offset + perPage - 1);

  const { data: leads, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  return NextResponse.json({
    leads: leads ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
  }, { status: 200 });
}

interface CreateLeadBody {
  company_name: string;
  domain?: string;
  url?: string;
  title?: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  status?: LeadStatus;
  pipeline_stage?: PipelineStage;
  notes?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateLeadBody;
  try {
    body = await request.json() as CreateLeadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.company_name || typeof body.company_name !== 'string') {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      user_id: user.id,
      company_name: body.company_name,
      domain: body.domain ?? null,
      url: body.url ?? null,
      title: body.title ?? null,
      description: body.description ?? null,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      contact_linkedin: body.contact_linkedin ?? null,
      status: body.status ?? 'new',
      pipeline_stage: body.pipeline_stage ?? 'discovery',
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }

  return NextResponse.json({ lead }, { status: 201 });
}
