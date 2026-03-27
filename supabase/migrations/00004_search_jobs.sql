create type public.search_job_status as enum ('pending', 'running', 'completed', 'failed');

create table public.search_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  query text not null,
  search_params jsonb not null default '{}',
  scoring_profile_id uuid references public.scoring_profiles,
  status search_job_status default 'pending' not null,
  results_count integer default 0,
  leads_created integer default 0,
  error_message text,
  results_data jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_search_jobs_user on public.search_jobs(user_id);

alter table public.search_jobs enable row level security;
create policy "Users manage own search jobs" on public.search_jobs for all using (auth.uid() = user_id);
