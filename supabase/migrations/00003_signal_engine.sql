create type public.signal_type as enum (
  'keyword', 'regex', 'technology', 'social_presence',
  'domain_age', 'page_metric', 'composite', 'custom_expression'
);

create table public.signal_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  signal_type signal_type not null,
  config jsonb not null default '{}',
  weight numeric(4,2) default 1.0 not null,
  max_score numeric(6,2) default 10.0 not null,
  category text,
  sort_order integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_signal_defs_user on public.signal_definitions(user_id);

create table public.signal_results (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  signal_definition_id uuid references public.signal_definitions on delete cascade not null,
  matched boolean default false not null,
  raw_score numeric(6,2) default 0 not null,
  weighted_score numeric(6,2) default 0 not null,
  match_details jsonb,
  evaluated_at timestamptz default now() not null,
  unique(lead_id, signal_definition_id)
);

create index idx_signal_results_lead on public.signal_results(lead_id);

create table public.scoring_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  qualification_threshold numeric(6,2) default 50.0 not null,
  signal_ids uuid[] not null default '{}',
  is_default boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.signal_definitions enable row level security;
alter table public.signal_results enable row level security;
alter table public.scoring_profiles enable row level security;

create policy "Users manage own signals" on public.signal_definitions for all using (auth.uid() = user_id);
create policy "Users see own signal results" on public.signal_results for all using (
  exists (select 1 from public.leads where id = lead_id and user_id = auth.uid())
);
create policy "Users manage own scoring profiles" on public.scoring_profiles for all using (auth.uid() = user_id);

create trigger on_signal_def_updated before update on public.signal_definitions
  for each row execute function public.handle_updated_at();
create trigger on_scoring_profile_updated before update on public.scoring_profiles
  for each row execute function public.handle_updated_at();
