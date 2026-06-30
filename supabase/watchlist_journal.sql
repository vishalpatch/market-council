-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Creates watchlist_items and journal_entries tables with per-user RLS.

-- ─── Watchlist ───────────────────────────────────────────────────────────────

create table if not exists public.watchlist_items (
  id        uuid        primary key default gen_random_uuid(),
  user_id   uuid        not null references auth.users (id) on delete cascade,
  ticker    text        not null,
  added_at  timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlist_items_user_idx
  on public.watchlist_items (user_id, added_at desc);

alter table public.watchlist_items enable row level security;

drop policy if exists "Users manage own watchlist" on public.watchlist_items;
create policy "Users manage own watchlist"
  on public.watchlist_items
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Trade Journal ────────────────────────────────────────────────────────────

create table if not exists public.journal_entries (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  ticker     text        not null,
  thesis     text        not null,
  status     text        not null check (status in ('Watching', 'Entered', 'Exited')),
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

drop policy if exists "Users manage own journal" on public.journal_entries;
create policy "Users manage own journal"
  on public.journal_entries
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
