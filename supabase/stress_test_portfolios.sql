-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Saved portfolios for the AI Portfolio Stress Test, scoped per user via RLS.

create table if not exists public.stress_test_portfolios (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  holdings   jsonb       not null,
  created_at timestamptz not null default now()
);

create index if not exists stress_test_portfolios_user_idx
  on public.stress_test_portfolios (user_id, created_at desc);

alter table public.stress_test_portfolios enable row level security;

drop policy if exists "Users manage own portfolios" on public.stress_test_portfolios;
create policy "Users manage own portfolios"
  on public.stress_test_portfolios
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
