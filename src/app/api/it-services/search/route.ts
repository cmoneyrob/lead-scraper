import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BraveSearchClient } from '@/lib/brave/client';
import { parseBraveResults } from '@/lib/brave/parse';

interface ITServicesSearchBody {
  location: string;
  serviceCategories: string[];
  industryVerticals: string[];
  companySize: string;
  painPoints: string[];
  freshness: string;
  count: number;
  customKeywords: string[];
}

const SERVICE_QUERY_MAP: Record<string, string[]> = {
  managed_it: ['managed IT services', 'IT support provider', 'outsourced IT'],
  cybersecurity: ['cybersecurity services', 'network security', 'IT security audit'],
  cloud_migration: ['cloud migration', 'cloud computing services', 'AWS Azure migration'],
  network_infrastructure: ['network infrastructure', 'IT networking', 'network setup'],
  data_backup_recovery: ['data backup services', 'disaster recovery IT', 'business continuity'],
  help_desk_support: ['IT help desk', 'IT support services', 'tech support'],
  software_development: ['custom software development', 'software consulting', 'app development'],
  voip_communications: ['VoIP phone system', 'business communications', 'unified communications'],
  it_consulting: ['IT consulting', 'technology strategy', 'IT advisory'],
  hardware_procurement: ['IT hardware procurement', 'computer equipment', 'IT asset management'],
  web_development: ['web development services', 'website design', 'web application development'],
  erp_crm: ['ERP implementation', 'CRM setup', 'business software integration'],
};

const INDUSTRY_QUERY_MAP: Record<string, string[]> = {
  healthcare: ['medical practice', 'healthcare clinic', 'dental office', 'medical office'],
  legal: ['law firm', 'legal practice', 'attorney office'],
  finance: ['accounting firm', 'financial services', 'CPA firm', 'insurance agency'],
  real_estate: ['real estate agency', 'property management', 'real estate broker'],
  manufacturing: ['manufacturing company', 'factory', 'industrial business'],
  retail: ['retail store', 'e-commerce business', 'shop'],
  construction: ['construction company', 'contractor', 'building company'],
  education: ['private school', 'training center', 'tutoring'],
  nonprofit: ['nonprofit organization', 'charity', 'NGO'],
  restaurant_hospitality: ['restaurant', 'hotel', 'hospitality business'],
  logistics: ['logistics company', 'trucking company', 'freight', 'shipping'],
  professional_services: ['consulting firm', 'staffing agency', 'business services'],
};

const PAIN_POINT_QUERY_MAP: Record<string, string[]> = {
  outdated_technology: ['technology upgrade', 'legacy systems', 'outdated computers'],
  no_it_department: ['no IT department', 'need IT help', 'looking for IT support'],
  security_breaches: ['data breach', 'security incident', 'hacked'],
  rapid_growth: ['fast growing company', 'scaling business', 'expanding business'],
  remote_work: ['remote work setup', 'work from home technology', 'hybrid workplace'],
  compliance: ['HIPAA compliance', 'PCI compliance', 'regulatory compliance IT'],
  slow_systems: ['slow network', 'system downtime', 'IT problems'],
  data_management: ['data management', 'database issues', 'data organization'],
  digital_transformation: ['digital transformation', 'business automation', 'going digital'],
  website_issues: ['need new website', 'website redesign', 'online presence'],
};

const SIZE_QUERY_MAP: Record<string, string> = {
  small: 'small business',
  medium: 'mid-size company',
  large: 'enterprise',
};

function buildSearchQuery(params: ITServicesSearchBody): string {
  const parts: string[] = [];

  // Add industry terms
  if (params.industryVerticals.length > 0) {
    const industryTerms = params.industryVerticals.flatMap(
      (v) => INDUSTRY_QUERY_MAP[v]?.slice(0, 2) ?? []
    );
    if (industryTerms.length > 0) {
      parts.push(`(${industryTerms.map((t) => `"${t}"`).join(' OR ')})`);
    }
  }

  // Add service need indicators
  if (params.serviceCategories.length > 0) {
    const serviceTerms = params.serviceCategories.flatMap(
      (s) => SERVICE_QUERY_MAP[s]?.slice(0, 1) ?? []
    );
    if (serviceTerms.length > 0) {
      parts.push(`(${serviceTerms.map((t) => `"${t}"`).join(' OR ')})`);
    }
  } else {
    // Default IT need indicators when no specific service selected
    parts.push('("need IT support" OR "looking for IT" OR "IT services" OR "technology solutions")');
  }

  // Add pain point terms
  if (params.painPoints.length > 0) {
    const painTerms = params.painPoints.flatMap(
      (p) => PAIN_POINT_QUERY_MAP[p]?.slice(0, 1) ?? []
    );
    if (painTerms.length > 0) {
      parts.push(`(${painTerms.map((t) => `"${t}"`).join(' OR ')})`);
    }
  }

  // Add company size hint
  if (params.companySize && params.companySize !== 'any') {
    const sizeHint = SIZE_QUERY_MAP[params.companySize];
    if (sizeHint) {
      parts.push(`"${sizeHint}"`);
    }
  }

  // Add location
  if (params.location) {
    parts.push(params.location);
  }

  // Add custom keywords
  if (params.customKeywords.length > 0) {
    parts.push(params.customKeywords.join(' '));
  }

  return parts.join(' ');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ITServicesSearchBody;
  try {
    body = await request.json() as ITServicesSearchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    !body.location &&
    (!body.serviceCategories || body.serviceCategories.length === 0) &&
    (!body.industryVerticals || body.industryVerticals.length === 0)
  ) {
    return NextResponse.json(
      { error: 'At least a location, service category, or industry must be provided' },
      { status: 400 }
    );
  }

  const query = buildSearchQuery(body);
  const count = body.count ?? 20;
  const freshness = body.freshness === 'all' ? undefined : body.freshness;

  const searchParams: Record<string, unknown> = {
    country: 'us',
    freshness,
    count,
    source: 'it_services_prospector',
    it_services_params: body,
  };

  const { data: job, error: insertError } = await supabase
    .from('search_jobs')
    .insert({
      user_id: user.id,
      query,
      search_params: searchParams,
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
      q: query,
      count,
      freshness: freshness as 'pd' | 'pw' | 'pm' | 'py' | undefined,
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

    return NextResponse.json({ job: updatedJob, results: parsedLeads, query }, { status: 200 });
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
