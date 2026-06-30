-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Adds Conviction Tracker fields to saved committee analyses:
--   outcome_note    — the user's free-text "what happened?" follow-up
--   user_agreement  — whether the user agreed with the committee verdict
-- Both default to null. The existing "Users manage own analyses" RLS policy
-- already covers these columns.

alter table public.committee_analyses
  add column if not exists outcome_note text;

alter table public.committee_analyses
  add column if not exists user_agreement boolean;
