-- stats_jobs: async server-side statistical jobs (E-06 bootstrap, large matrix)
-- Apply in Supabase SQL Editor (or CLI). Reloads PostgREST schema cache.

create table if not exists public.stats_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  code text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'error')),
  progress double precision not null default 0,
  request jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists stats_jobs_user_created_idx
  on public.stats_jobs (user_id, created_at desc);

create index if not exists stats_jobs_status_idx
  on public.stats_jobs (status, created_at);

alter table public.stats_jobs enable row level security;

-- Service role bypasses RLS; authenticated users may read own rows if using anon+JWT.
drop policy if exists stats_jobs_select_own on public.stats_jobs;
create policy stats_jobs_select_own on public.stats_jobs
  for select using (auth.uid()::text = user_id);

notify pgrst, 'reload schema';
