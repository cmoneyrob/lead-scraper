import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SignalType } from '@/types/database';

interface GenerateSignalsBody {
  serviceCategories: string[];
  industryVerticals: string[];
  painPoints: string[];
}

const SERVICE_KEYWORDS: Record<string, { name: string; keywords: string[] }> = {
  managed_it: {
    name: 'Managed IT Need',
    keywords: ['managed services', 'outsourced IT', 'IT provider', 'MSP', 'IT support', 'help desk', 'IT management'],
  },
  cybersecurity: {
    name: 'Cybersecurity Need',
    keywords: ['cybersecurity', 'data breach', 'ransomware', 'security audit', 'firewall', 'endpoint protection', 'phishing'],
  },
  cloud_migration: {
    name: 'Cloud Migration Need',
    keywords: ['cloud migration', 'cloud computing', 'AWS', 'Azure', 'Google Cloud', 'SaaS', 'cloud infrastructure'],
  },
  network_infrastructure: {
    name: 'Network Infrastructure Need',
    keywords: ['network infrastructure', 'WiFi', 'LAN', 'WAN', 'network setup', 'cabling', 'switches', 'routers'],
  },
  data_backup_recovery: {
    name: 'Backup & Recovery Need',
    keywords: ['data backup', 'disaster recovery', 'business continuity', 'data loss', 'backup solution'],
  },
  help_desk_support: {
    name: 'Help Desk Need',
    keywords: ['help desk', 'IT support', 'tech support', 'IT troubleshooting', 'support ticket'],
  },
  software_development: {
    name: 'Software Dev Need',
    keywords: ['custom software', 'app development', 'software solution', 'automation', 'integration'],
  },
  voip_communications: {
    name: 'VoIP Need',
    keywords: ['VoIP', 'phone system', 'unified communications', 'video conferencing', 'business phone'],
  },
  it_consulting: {
    name: 'IT Consulting Need',
    keywords: ['IT consulting', 'technology strategy', 'IT roadmap', 'digital strategy', 'IT assessment'],
  },
  hardware_procurement: {
    name: 'Hardware Need',
    keywords: ['hardware procurement', 'computer equipment', 'servers', 'workstations', 'IT assets', 'laptops'],
  },
  web_development: {
    name: 'Web Development Need',
    keywords: ['website', 'web development', 'web design', 'online presence', 'e-commerce site', 'landing page'],
  },
  erp_crm: {
    name: 'ERP/CRM Need',
    keywords: ['ERP', 'CRM', 'Salesforce', 'SAP', 'business software', 'inventory management'],
  },
};

const INDUSTRY_KEYWORDS: Record<string, { name: string; keywords: string[] }> = {
  healthcare: { name: 'Healthcare Industry', keywords: ['healthcare', 'medical', 'clinic', 'HIPAA', 'patient', 'hospital', 'dental'] },
  legal: { name: 'Legal Industry', keywords: ['law firm', 'attorney', 'legal', 'lawyer', 'paralegal', 'litigation'] },
  finance: { name: 'Finance Industry', keywords: ['accounting', 'financial', 'CPA', 'insurance', 'banking', 'investment'] },
  real_estate: { name: 'Real Estate Industry', keywords: ['real estate', 'property', 'broker', 'MLS', 'listings', 'realtor'] },
  manufacturing: { name: 'Manufacturing Industry', keywords: ['manufacturing', 'factory', 'production', 'industrial', 'warehouse'] },
  retail: { name: 'Retail Industry', keywords: ['retail', 'store', 'e-commerce', 'POS', 'inventory', 'shopping'] },
  construction: { name: 'Construction Industry', keywords: ['construction', 'contractor', 'building', 'project management', 'blueprint'] },
  education: { name: 'Education Industry', keywords: ['school', 'education', 'training', 'learning', 'students', 'curriculum'] },
  nonprofit: { name: 'Nonprofit Sector', keywords: ['nonprofit', 'charity', 'donation', 'volunteer', 'fundraising', 'grant'] },
  restaurant_hospitality: { name: 'Hospitality Industry', keywords: ['restaurant', 'hotel', 'hospitality', 'dining', 'reservation', 'catering'] },
  logistics: { name: 'Logistics Industry', keywords: ['logistics', 'shipping', 'freight', 'trucking', 'supply chain', 'warehouse'] },
  professional_services: { name: 'Professional Services', keywords: ['consulting', 'staffing', 'agency', 'professional services', 'advisory'] },
};

const PAIN_POINT_KEYWORDS: Record<string, { name: string; keywords: string[] }> = {
  outdated_technology: { name: 'Outdated Tech Signal', keywords: ['outdated', 'legacy system', 'upgrade needed', 'old technology', 'end of life'] },
  no_it_department: { name: 'No IT Dept Signal', keywords: ['no IT department', 'need IT help', 'IT outsource', 'looking for IT'] },
  security_breaches: { name: 'Security Breach Signal', keywords: ['breach', 'hacked', 'security incident', 'data leak', 'compromised'] },
  rapid_growth: { name: 'Growth Signal', keywords: ['growing', 'expanding', 'scaling', 'hiring', 'new office', 'rapid growth'] },
  remote_work: { name: 'Remote Work Signal', keywords: ['remote work', 'work from home', 'hybrid', 'virtual office', 'distributed team'] },
  compliance: { name: 'Compliance Signal', keywords: ['compliance', 'HIPAA', 'PCI', 'SOC 2', 'GDPR', 'regulatory', 'audit'] },
  slow_systems: { name: 'System Issues Signal', keywords: ['slow system', 'downtime', 'outage', 'unreliable', 'IT problems', 'system issues'] },
  data_management: { name: 'Data Mgmt Signal', keywords: ['data management', 'database', 'data organization', 'data migration', 'big data'] },
  digital_transformation: { name: 'Digital Transform Signal', keywords: ['digital transformation', 'automation', 'modernize', 'digital', 'paperless'] },
  website_issues: { name: 'Website Issues Signal', keywords: ['website redesign', 'new website', 'online presence', 'SEO', 'web traffic'] },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GenerateSignalsBody;
  try {
    body = await request.json() as GenerateSignalsBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const signalsToCreate: Array<{
    user_id: string;
    name: string;
    description: string;
    signal_type: SignalType;
    config: Record<string, unknown>;
    weight: number;
    max_score: number;
    category: string;
    is_active: boolean;
  }> = [];

  // Create signals for selected IT service categories
  for (const cat of body.serviceCategories ?? []) {
    const mapping = SERVICE_KEYWORDS[cat];
    if (!mapping) continue;
    signalsToCreate.push({
      user_id: user.id,
      name: mapping.name,
      description: `Detects businesses with potential need for ${mapping.name.toLowerCase().replace(' need', '')} services`,
      signal_type: 'keyword' as SignalType,
      config: {
        keywords: mapping.keywords,
        field: 'content',
        case_sensitive: false,
        match_mode: 'any',
      },
      weight: 1.5,
      max_score: 15,
      category: 'IT Services',
      is_active: true,
    });
  }

  // Create signals for selected industry verticals
  for (const ind of body.industryVerticals ?? []) {
    const mapping = INDUSTRY_KEYWORDS[ind];
    if (!mapping) continue;
    signalsToCreate.push({
      user_id: user.id,
      name: mapping.name,
      description: `Identifies businesses in the ${mapping.name.toLowerCase().replace(' industry', '').replace(' sector', '')} sector`,
      signal_type: 'keyword' as SignalType,
      config: {
        keywords: mapping.keywords,
        field: 'content',
        case_sensitive: false,
        match_mode: 'any',
      },
      weight: 1,
      max_score: 10,
      category: 'IT Services',
      is_active: true,
    });
  }

  // Create signals for selected pain points
  for (const pp of body.painPoints ?? []) {
    const mapping = PAIN_POINT_KEYWORDS[pp];
    if (!mapping) continue;
    signalsToCreate.push({
      user_id: user.id,
      name: mapping.name,
      description: `Detects ${mapping.name.toLowerCase().replace(' signal', '')} indicators`,
      signal_type: 'keyword' as SignalType,
      config: {
        keywords: mapping.keywords,
        field: 'content',
        case_sensitive: false,
        match_mode: 'any',
      },
      weight: 2,
      max_score: 20,
      category: 'IT Services',
      is_active: true,
    });
  }

  if (signalsToCreate.length === 0) {
    return NextResponse.json(
      { error: 'No categories selected to generate signals from' },
      { status: 400 }
    );
  }

  const { data: signals, error } = await supabase
    .from('signal_definitions')
    .insert(signalsToCreate)
    .select();

  if (error) {
    return NextResponse.json({ error: 'Failed to create signals' }, { status: 500 });
  }

  return NextResponse.json({ signals, count: signals?.length ?? 0 }, { status: 201 });
}
