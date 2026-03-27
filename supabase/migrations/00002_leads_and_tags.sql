create type public.lead_status as enum ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost');
create type public.pipeline_stage as enum ('discovery', 'research', 'outreach', 'negotiation', 'closed_won', 'closed_lost');

create table public.leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  domain text,
  url text,
  title text,
  description text,
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_linkedin text,
  status lead_status default 'new' not null,
  pipeline_stage pipeline_stage default 'discovery' not null,
  total_score numeric(6,2) default 0 not null,
  qualified boolean default false not null,
  qualification_threshold numeric(6,2),
  raw_search_result jsonb,
  enrichment_data jsonb,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_scored_at timestamptz
);

create index idx_leads_user_id on public.leads(user_id);
create index idx_leads_domain on public.leads(domain);
create index idx_leads_status on public.leads(status);
create index idx_leads_total_score on public.leads(total_score desc);
create index idx_leads_qualified on public.leads(user_id, qualified);

create table public.tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text default '#6366f1' not null,
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

create table public.lead_tags (
  lead_id uuid references public.leads on delete cascade not null,
  tag_id uuid references public.tags on delete cascade not null,
  primary key (lead_id, tag_id)
);

alter table public.leads enable row level security;
alter table public.tags enable row level security;
alter table public.lead_tags enable row level security;

create policy "Users manage own leads" on public.leads for all using (auth.uid() = user_id);
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id);
create policy "Users manage own lead_tags" on public.lead_tags for all using (
  exists (select 1 from public.leads where id = lead_id and user_id = auth.uid())
);

create trigger on_lead_updated before update on public.leads
  for each row execute function public.handle_updated_at();
