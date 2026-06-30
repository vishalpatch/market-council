-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Adds an optional win/loss/neutral outcome to journal entries, used by the
-- Performance Analytics dashboard. Defaults to null (untagged).

alter table public.journal_entries
  add column if not exists outcome text
  check (outcome in ('win', 'loss', 'neutral'));

-- Existing RLS policy ("Users manage own journal") already covers this column,
-- since it applies to the whole row for all commands.
