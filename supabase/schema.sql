-- ==============================================================================
-- CoPassage: FINAL MASTER SCHEMA (supersedes all prior versions)
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bunwfktdkfgcokvvqhwc/sql/new
--
-- WARNING: Drop existing tables first if they exist with old column names.
-- This is safe for pre-launch / hackathon stage.
-- ==============================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Profiles ───
create table if not exists profiles (
  id         text primary key,   -- Firebase UID
  phone      text,
  full_name  text,
  role       text check (role in ('rider','city_staff','help_center','admin')),
  zone_id    text,
  subscription_tier text check (subscription_tier in ('free','plus','unlimited')) default 'free',
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz default now()
);

-- Migration safety for existing databases
alter table profiles
  add column if not exists subscription_tier text
    check (subscription_tier in ('free','plus','unlimited'))
    default 'free',
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_expires_at timestamptz;

-- ─── Open posts (host broadcasting) ───
create table if not exists rider_open_posts (
  id              uuid primary key default gen_random_uuid(),
  host_uid        text not null,
  host_name       text not null,
  host_phone      text not null,
  origin_lat      float8 not null,
  origin_lng      float8 not null,
  dest_lat        float8,
  dest_lng        float8,
  dest_label      text,
  current_lat     float8 not null,
  current_lng     float8 not null,
  total_fare      int,
  max_riders      int default 3,
  current_riders  int default 1,
  status          text default 'open', -- open | matched | completed | cancelled
  host_marked_complete boolean default false,
  last_seen_at    timestamptz default now(),
  created_at      timestamptz default now()
);

-- ─── Join requests ───
create table if not exists join_requests (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid references rider_open_posts(id) on delete cascade,
  requester_uid     text not null,
  requester_name    text not null,
  requester_phone   text not null,
  requester_lat     float8,   -- only populated after acceptance
  requester_lng     float8,
  rider_marked_complete boolean default false,
  status            text default 'pending', -- pending | accepted | rejected
  detour_excess_km  numeric,                -- km of excess distance host must travel
  detour_surcharge_amount numeric default 0, -- ₹ surcharge (display-only, settled offline)
  detour_surcharge_accepted boolean default false,
  detour_surcharge_accepted_at timestamptz,
  created_at        timestamptz default now()
);

-- ─── Chat ───
create table if not exists ride_messages (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references rider_open_posts(id) on delete cascade,
  sender_uid text not null,
  sender_name text not null,
  body       text not null,
  created_at timestamptz default now()
);

-- ─── SOS (canonical table — Intermediate Panel reads this directly) ───
create table if not exists rider_sos_events (
  id           uuid primary key default gen_random_uuid(),
  rider_uid    text not null,
  rider_name   text not null,
  rider_phone  text not null,
  post_id      uuid references rider_open_posts(id),
  latitude     float8 not null,
  longitude    float8 not null,
  description  text,
  status       text default 'active', -- active | acknowledged | resolved
  acknowledged_by text,
  resolved_at  timestamptz,
  created_at   timestamptz default now()
);

-- ─── Reviews (co-rider to co-rider, never the driver) ───
create table if not exists rider_ratings (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references rider_open_posts(id),
  rater_uid  text not null,
  rated_uid  text not null,
  stars      int not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz default now()
);

-- ─── Support tickets (rider-submitted) ───
create table if not exists rider_support_tickets (
  id           uuid primary key default gen_random_uuid(),
  rider_uid    text not null,
  severity     text check (severity in ('low','medium','high','urgent')),
  category     text check (category in ('fare_dispute','safety','vehicle_condition',
                 'driver_behavior','app_issue','payment','route_deviation','other')),
  subject      text,
  description  text,
  status       text default 'open',
  created_at   timestamptz default now()
);

-- ─── User Payments & Subscriptions (Razorpay) ───
create table if not exists user_payments (
  id                  uuid primary key default gen_random_uuid(),
  user_uid            text not null,
  plan_id             text not null,
  amount_inr          int not null,
  razorpay_payment_id text not null,
  razorpay_order_id   text,
  status              text default 'success',
  created_at          timestamptz default now()
);

-- Add subscription tier columns to profiles
alter table profiles add column if not exists subscription_tier text default 'free' check (subscription_tier in ('free','plus','unlimited'));
alter table profiles add column if not exists subscription_expiry timestamptz;
alter table profiles add column if not exists last_payment_id text;

-- Add email column with unique constraint ("one mail one time")
alter table profiles add column if not exists email text;
create unique index if not exists idx_profiles_email on profiles(lower(email)) where email is not null;


-- ==============================================================================
-- RLS
-- ==============================================================================
alter table profiles enable row level security;
alter table rider_open_posts enable row level security;
alter table join_requests enable row level security;
alter table ride_messages enable row level security;
alter table rider_sos_events enable row level security;
alter table rider_ratings enable row level security;
alter table rider_support_tickets enable row level security;

-- ─── profiles: public read & upsert for registration ───
drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles
  for select using (true);

drop policy if exists "public upsert profiles" on profiles;
create policy "public upsert profiles" on profiles
  for all using (true) with check (true);

-- ─── rider_open_posts: public read, host-only write ───
create policy "public read open posts" on rider_open_posts
  for select using (true);
create policy "host manages own post" on rider_open_posts
  for all
  using (host_uid = (select auth.uid()::text))
  with check (host_uid = (select auth.uid()::text));

-- ─── join_requests ───
create policy "requester manages own request" on join_requests
  for insert
  with check (requester_uid = (select auth.uid()::text));
create policy "requester updates own request" on join_requests
  for update
  using (requester_uid = (select auth.uid()::text))
  with check (
    requester_uid = (select auth.uid()::text)
    and (
      (requester_lat is null and requester_lng is null)
      or status = 'accepted'
    )
  );
create policy "host reads requests for their post" on join_requests
  for select
  using (
    exists (select 1 from rider_open_posts
            where id = join_requests.post_id
            and host_uid = (select auth.uid()::text))
    or requester_uid = (select auth.uid()::text)
  );
create policy "host accepts or rejects requests" on join_requests
  for update
  using (
    exists (select 1 from rider_open_posts
            where id = join_requests.post_id
            and host_uid = (select auth.uid()::text))
  );

-- ─── ride_messages: only matched riders ───
create policy "matched riders read chat" on ride_messages
  for select using (
    exists (
      select 1 from rider_open_posts p
      left join join_requests jr on jr.post_id = p.id
      where p.id = ride_messages.post_id
        and (p.host_uid = (select auth.uid()::text)
             or (jr.requester_uid = (select auth.uid()::text) and jr.status = 'accepted'))
    )
  );
create policy "matched riders send chat" on ride_messages
  for insert with check (
    sender_uid = (select auth.uid()::text)
    and exists (
      select 1 from rider_open_posts p
      left join join_requests jr on jr.post_id = p.id
      where p.id = ride_messages.post_id
        and (p.host_uid = (select auth.uid()::text)
             or (jr.requester_uid = (select auth.uid()::text) and jr.status = 'accepted'))
    )
  );

-- ─── rider_sos_events ───
create policy "rider creates own sos event" on rider_sos_events
  for insert with check (rider_uid = (select auth.uid()::text));
create policy "rider reads own sos events" on rider_sos_events
  for select using (rider_uid = (select auth.uid()::text));
create policy "staff read all sos events" on rider_sos_events
  for select using (
    exists (select 1 from profiles where id = (select auth.uid()::text)
            and role in ('city_staff','help_center','admin'))
  );
create policy "staff update sos events" on rider_sos_events
  for update using (
    exists (select 1 from profiles where id = (select auth.uid()::text)
            and role in ('city_staff','help_center','admin'))
  );

-- ─── rider_ratings ───
create policy "rider reviews own completed ride" on rider_ratings
  for insert with check (
    rater_uid = (select auth.uid()::text)
    and exists (
      select 1 from rider_open_posts p
      left join join_requests jr on jr.post_id = p.id
      where p.id = rider_ratings.post_id and p.status = 'completed'
        and (p.host_uid = (select auth.uid()::text)
             or (jr.requester_uid = (select auth.uid()::text) and jr.status = 'accepted'))
    )
  );
create policy "rider reads received ratings" on rider_ratings
  for select using (rated_uid = (select auth.uid()::text));
create policy "rider reads given ratings" on rider_ratings
  for select using (rater_uid = (select auth.uid()::text));

-- ─── rider_support_tickets ───
create policy "rider manages own tickets" on rider_support_tickets
  for all using (rider_uid = (select auth.uid()::text))
  with check (rider_uid = (select auth.uid()::text));

-- ─── user_payments ───
alter table user_payments enable row level security;
create policy "users read own payments" on user_payments
  for select using (user_uid = (select auth.uid()::text) or true);
create policy "users insert own payments" on user_payments
  for insert with check (true);

-- ==============================================================================
-- TRIGGER: server-side mutual-completion resolution
-- NEITHER client writes rider_open_posts.status directly for completion.
-- ==============================================================================
create or replace function check_and_complete_ride()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_host_complete boolean;
  v_rider_complete boolean;
begin
  if TG_TABLE_NAME = 'rider_open_posts' then
    v_post_id := NEW.id;
    v_host_complete := NEW.host_marked_complete;
    select rider_marked_complete into v_rider_complete
      from join_requests where post_id = v_post_id and status = 'accepted' limit 1;
  else
    v_post_id := NEW.post_id;
    v_rider_complete := NEW.rider_marked_complete;
    select host_marked_complete into v_host_complete
      from rider_open_posts where id = v_post_id;
  end if;

  if v_host_complete is true and v_rider_complete is true then
    update rider_open_posts set status = 'completed'
      where id = v_post_id and status <> 'completed';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_complete_on_post on rider_open_posts;
create trigger trg_complete_on_post
  after update of host_marked_complete on rider_open_posts
  for each row when (NEW.host_marked_complete is true)
  execute function check_and_complete_ride();

drop trigger if exists trg_complete_on_request on join_requests;
create trigger trg_complete_on_request
  after update of rider_marked_complete on join_requests
  for each row when (NEW.rider_marked_complete is true)
  execute function check_and_complete_ride();

-- ==============================================================================
-- Realtime Publication
-- ==============================================================================
do $$
begin
  alter publication supabase_realtime add table rider_open_posts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table join_requests;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table ride_messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table rider_sos_events;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table rider_ratings;
exception when others then null;
end $$;

-- ==============================================================================
-- Subscription Tier Usage Tracking
-- ==============================================================================

-- Track ride usage per calendar month, per rider
create table if not exists rider_monthly_usage (
  id            uuid primary key default gen_random_uuid(),
  rider_uid     text not null,
  month_key     text not null,  -- format: 'YYYY-MM', e.g. '2026-09'
  rides_used    int not null default 0,
  created_at    timestamptz default now(),
  unique (rider_uid, month_key)
);

alter table rider_monthly_usage enable row level security;

create policy "rider reads own usage" on rider_monthly_usage
  for select using (rider_uid = (select auth.uid()::text));
-- Writes to this table happen via a server-side function (see below),
-- never directly from the client, so no client insert/update policy
-- is granted — this prevents a rider from resetting their own count.

-- Atomic Ride Usage Increment & Limit Gate (Called when a ride is confirmed)
create or replace function increment_ride_usage(p_rider_uid text)
returns table(allowed boolean, rides_used int, rides_limit int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_limit int;
  v_month text := to_char(now(), 'YYYY-MM');
  v_current int;
begin
  select subscription_tier into v_tier from profiles where id = p_rider_uid;
  if v_tier is null then
    v_tier := 'free';
  end if;

  v_limit := case v_tier
    when 'free' then 5
    when 'plus' then 20
    else null -- unlimited
  end;

  insert into rider_monthly_usage (rider_uid, month_key, rides_used)
    values (p_rider_uid, v_month, 0)
    on conflict (rider_uid, month_key) do nothing;

  select rmu.rides_used into v_current from rider_monthly_usage rmu
    where rmu.rider_uid = p_rider_uid and rmu.month_key = v_month;

  if v_limit is not null and v_current >= v_limit then
    return query select false, v_current, v_limit;
    return;
  end if;

  update rider_monthly_usage
    set rides_used = rides_used + 1
    where rider_uid = p_rider_uid and month_key = v_month;

  return query select true, v_current + 1, v_limit;
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. COPASSAGE VAULT & PLATFORM FEE COMMITMENT INFRASTRUCTURE
-- ══════════════════════════════════════════════════════════════════════════════

-- Wallet balance per user (CoPassage Vault)
create table if not exists rider_wallets (
  rider_uid    text primary key,
  balance      numeric not null default 0,
  updated_at   timestamptz default now()
);

alter table rider_wallets enable row level security;

-- Commuters can view their own Vault balance
create policy "rider reads own wallet" on rider_wallets
  for select using (rider_uid = (select auth.uid()::text));

-- All balance changes must go through security definer functions debit_wallet / credit_wallet

-- Full transaction audit ledger
create table if not exists wallet_transactions (
  id                  uuid primary key default gen_random_uuid(),
  rider_uid           text not null,
  amount              numeric not null, -- positive = credit, negative = debit
  type                text not null check (type in (
                        'request_fee_debit', 'accept_fee_debit',
                        'reject_refund_credit', 'razorpay_topup_credit',
                        'expiry_refund_credit'
                      )),
  related_post_id     uuid references rider_open_posts(id),
  related_request_id  uuid references join_requests(id),
  razorpay_payment_id text,
  balance_after       numeric not null,
  created_at          timestamptz default now()
);

alter table wallet_transactions enable row level security;

create policy "rider reads own transactions" on wallet_transactions
  for select using (rider_uid = (select auth.uid()::text));

-- Track fee state per join request
alter table join_requests
  add column if not exists requester_fee_amount numeric,
  add column if not exists requester_fee_paid_via text
    check (requester_fee_paid_via in ('razorpay','vault')),
  add column if not exists requester_fee_status text
    default 'unpaid' check (requester_fee_status in ('unpaid','paid','refunded')),
  add column if not exists host_fee_amount numeric,
  add column if not exists host_fee_paid_via text
    check (host_fee_paid_via in ('razorpay','vault')),
  add column if not exists host_fee_status text
    default 'unpaid' check (host_fee_status in ('unpaid','paid','refunded'));

-- Debit wallet (used for both request-fee and accept-fee payment)
create or replace function debit_wallet(
  p_rider_uid text,
  p_amount numeric,
  p_type text,
  p_post_id uuid default null,
  p_request_id uuid default null
)
returns table(success boolean, new_balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  select balance into v_balance from rider_wallets where rider_uid = p_rider_uid for update;
  if v_balance is null then
    insert into rider_wallets (rider_uid, balance) values (p_rider_uid, 0);
    v_balance := 0;
  end if;

  if v_balance < p_amount then
    return query select false, v_balance;
    return;
  end if;

  update rider_wallets
    set balance = balance - p_amount, updated_at = now()
    where rider_uid = p_rider_uid;

  insert into wallet_transactions
    (rider_uid, amount, type, related_post_id, related_request_id, balance_after)
    values (p_rider_uid, -p_amount, p_type, p_post_id, p_request_id, v_balance - p_amount);

  return query select true, v_balance - p_amount;
end;
$$;

-- Credit wallet (used for Razorpay top-ups AND automatic refunds on rejection)
create or replace function credit_wallet(
  p_rider_uid text,
  p_amount numeric,
  p_type text,
  p_post_id uuid default null,
  p_request_id uuid default null,
  p_razorpay_payment_id text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  insert into rider_wallets (rider_uid, balance) values (p_rider_uid, p_amount)
    on conflict (rider_uid) do update set balance = rider_wallets.balance + p_amount, updated_at = now()
    returning balance into v_new_balance;

  insert into wallet_transactions
    (rider_uid, amount, type, related_post_id, related_request_id, razorpay_payment_id, balance_after)
    values (p_rider_uid, p_amount, p_type, p_post_id, p_request_id, p_razorpay_payment_id, v_new_balance);

  return v_new_balance;
end;
$$;

-- Auto-refund trigger: when a join_request status changes to 'rejected'
-- AND the requester had already paid, refund fee automatically to their Vault
create or replace function refund_on_rejection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status in ('rejected', 'cancelled') and OLD.status = 'pending'
     and NEW.requester_fee_status = 'paid' then
    perform credit_wallet(
      NEW.requester_uid,
      NEW.requester_fee_amount,
      'reject_refund_credit',
      NEW.post_id,
      NEW.id
    );
    update join_requests set requester_fee_status = 'refunded' where id = NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_refund_on_rejection on join_requests;
create trigger trg_refund_on_rejection
  after update of status on join_requests
  for each row
  execute function refund_on_rejection();

-- ─── Seed Pre-Configured Test Accounts & Wallets ───
-- 1. Shubham Mendpara: Pro / Unlimited tier (0 in wallet)
-- 2. Nisarg Makwana: Plus tier (0 in wallet)
-- 3. Priya Sharma: Plus tier + ₹1,00,000 in CoPassage Vault
-- 4. Rohan Patel: Normal user + ₹1,00,000 in CoPassage Vault
-- 5. Ananya Kotadiya: Normal user (0 in wallet)

insert into profiles (id, phone, full_name, role, subscription_tier)
values
  ('firebase_test_9875101054', '9875101054', 'Shubham Mendpara', 'rider', 'unlimited'),
  ('firebase_test_8849350719', '8849350719', 'Nisarg Makwana', 'rider', 'plus'),
  ('firebase_test_9824597605', '9824597605', 'Priya Sharma', 'rider', 'plus'),
  ('firebase_test_9974144230', '9974144230', 'Rohan Patel', 'rider', 'free'),
  ('firebase_test_7572867636', '7572867636', 'Ananya Kotadiya', 'rider', 'free')
on conflict (id) do update set
  subscription_tier = excluded.subscription_tier,
  full_name = excluded.full_name;

insert into rider_wallets (rider_uid, balance)
values
  ('firebase_test_9875101054', 0),
  ('firebase_test_8849350719', 0),
  ('firebase_test_9824597605', 100000),
  ('firebase_test_9974144230', 100000),
  ('firebase_test_7572867636', 0)
on conflict (rider_uid) do update set
  balance = excluded.balance,
  updated_at = now();

insert into wallet_transactions (rider_uid, amount, type, balance_after)
values
  ('firebase_test_9824597605', 100000, 'topup', 100000),
  ('firebase_test_9974144230', 100000, 'topup', 100000)
on conflict do nothing;



