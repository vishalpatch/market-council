-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Monetization schema: subscriptions, AI usage, teams, and promo codes.

-- ─── Subscriptions ────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null unique references auth.users (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text        not null default 'free'
                           check (plan in ('free', 'starter', 'pro', 'analyst', 'team')),
  status                 text        not null default 'active'
                           check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end     timestamptz,
  ai_model               text,
  monthly_ai_limit       integer,
  created_at             timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);
alter table public.subscriptions enable row level security;
drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
-- Writes happen via the service role (Stripe webhook / signup), which bypasses RLS.

-- ─── AI usage ─────────────────────────────────────────────────────────────────
create table if not exists public.ai_usage (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  feature      text        not null check (feature in ('committee', 'devils_advocate', 'market_pulse')),
  used_at      timestamptz not null default now(),
  period_start timestamptz not null
);
create index if not exists ai_usage_user_period_idx
  on public.ai_usage (user_id, feature, period_start);
alter table public.ai_usage enable row level security;
drop policy if exists "Users manage own usage" on public.ai_usage;
create policy "Users manage own usage"
  on public.ai_usage for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Teams ────────────────────────────────────────────────────────────────────
create table if not exists public.teams (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  owner_user_id          uuid        not null references auth.users (id) on delete cascade,
  stripe_subscription_id text,
  seat_count             integer     not null default 10,
  created_at             timestamptz not null default now()
);
alter table public.teams enable row level security;
drop policy if exists "Members read their team" on public.teams;
create policy "Members read their team"
  on public.teams for select using (
    owner_user_id = auth.uid()
    or exists (select 1 from public.team_members m where m.team_id = teams.id and m.user_id = auth.uid())
  );

create table if not exists public.team_members (
  id        uuid        primary key default gen_random_uuid(),
  team_id   uuid        not null references public.teams (id) on delete cascade,
  user_id   uuid        not null references auth.users (id) on delete cascade,
  role      text        not null default 'member' check (role in ('owner', 'manager', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create index if not exists team_members_team_idx on public.team_members (team_id);
alter table public.team_members enable row level security;
drop policy if exists "Users read own membership" on public.team_members;
create policy "Users read own membership"
  on public.team_members for select using (user_id = auth.uid());
-- The full member roster is served via a service-role route after verifying the caller.

create table if not exists public.team_messages (
  id         uuid        primary key default gen_random_uuid(),
  team_id    uuid        not null references public.teams (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  content    text        not null,
  pinned     boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists team_messages_team_idx on public.team_messages (team_id, created_at desc);
alter table public.team_messages enable row level security;
drop policy if exists "Team members read messages" on public.team_messages;
create policy "Team members read messages"
  on public.team_messages for select using (
    exists (select 1 from public.team_members m where m.team_id = team_messages.team_id and m.user_id = auth.uid())
  );
drop policy if exists "Team members post messages" on public.team_messages;
create policy "Team members post messages"
  on public.team_messages for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.team_members m where m.team_id = team_messages.team_id and m.user_id = auth.uid())
  );

-- ─── Promo codes (admin / service-role only) ──────────────────────────────────
create table if not exists public.promo_codes (
  id               uuid        primary key default gen_random_uuid(),
  code             text        not null unique,
  discount_type    text        not null,
  discount_value   numeric     not null default 0,
  applies_to_plans text[]      not null default '{}',
  max_uses         integer,
  uses_so_far      integer     not null default 0,
  expires_at       timestamptz,
  active           boolean     not null default true,
  created_at       timestamptz not null default now()
);
-- RLS enabled with NO policy → only the service role can read/write.
alter table public.promo_codes enable row level security;
