create type public.scrape_job_status as enum ('pending', 'running', 'searching', 'scraping', 'scoring', 'completed', 'failed');

create table public.scrape_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  signal_ids uuid[] not null default '{}',
  scoring_profile_id uuid references public.scoring_profiles,
  status scrape_job_status default 'pending' not null,
  query_generated text,
  location text,
  search_params jsonb not null default '{}',
  results_found integer default 0,
  leads_created integer default 0,
  leads_qualified integer default 0,
  leads_scraped integer default 0,
  error_message text,
  log jsonb not null default '[]',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_scrape_jobs_user on public.scrape_jobs(user_id);
create index idx_scrape_jobs_status on public.scrape_jobs(status);

alter table public.scrape_jobs enable row level security;
create policy "Users manage own scrape jobs" on public.scrape_jobs for all using (auth.uid() = user_id);
