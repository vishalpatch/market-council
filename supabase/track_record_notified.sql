-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Tracks which milestone emails (30/60/90 days) have already been sent for a
-- Track Record snapshot, so the notification cron doesn't send duplicates.

alter table public.track_record_snapshots
  add column if not exists notified_days integer[] not null default '{}';
