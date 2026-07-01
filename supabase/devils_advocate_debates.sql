-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Saved Devil's Advocate debates, scoped per user via RLS.

create table if not exists public.devils_advocate_debates (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  ticker          text,
  rounds          jsonb       not null,
  referee_verdict jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists devils_advocate_debates_user_idx
  on public.devils_advocate_debates (user_id, created_at desc);

alter table public.devils_advocate_debates enable row level security;

drop policy if exists "Users manage own debates" on public.devils_advocate_debates;
create policy "Users manage own debates"
  on public.devils_advocate_debates
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
