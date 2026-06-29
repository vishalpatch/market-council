-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Stores saved AI Investment Committee analyses, scoped per user via RLS.

create table if not exists public.committee_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  thesis text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists committee_analyses_user_created_idx
  on public.committee_analyses (user_id, created_at desc);

alter table public.committee_analyses enable row level security;

-- Each user can only read/insert/update/delete their own analyses.
drop policy if exists "Users manage own analyses" on public.committee_analyses;
create policy "Users manage own analyses"
  on public.committee_analyses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
