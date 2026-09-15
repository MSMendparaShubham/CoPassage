-- ==============================================================================
-- CoPassage: Post-Auth Rider Experience Database Schema & RLS Policies
-- Execute this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bunwfktdkfgcokvvqhwc/sql/new
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. rider_open_posts (Host location broadcast)
create table if not exists public.rider_open_posts (
  id uuid primary key default gen_random_uuid(),
  host_uid text not null,
  host_name text not null,
  host_phone text not null,
  destination text not null,
  fare numeric not null,
  seats_available integer not null default 2,
  current_lat double precision not null,
  current_lng double precision not null,
  status text not null default 'active' check (status in ('active', 'matched', 'completed', 'cancelled')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3. join_requests (Co-rider requests to join a host post)
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.rider_open_posts(id) on delete cascade,
  requester_uid text not null,
  requester_name text not null,
  requester_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  requester_lat double precision,
  requester_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. ride_messages (In-ride chat between matched riders)
create table if not exists public.ride_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.rider_open_posts(id) on delete cascade,
  sender_uid text not null,
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 5. rider_sos_events (Canonical SOS table)
create table if not exists public.rider_sos_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.rider_open_posts(id) on delete cascade,
  triggered_by_uid text not null,
  triggered_by_name text not null,
  triggered_by_phone text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- Enable RLS on all 4 tables
alter table public.rider_open_posts enable row level security;
alter table public.join_requests enable row level security;
alter table public.ride_messages enable row level security;
alter table public.rider_sos_events enable row level security;

-- ------------------------------------------------------------------------------
-- Policies for rider_open_posts:
-- ------------------------------------------------------------------------------
drop policy if exists "anyone can view recent active posts" on public.rider_open_posts;
create policy "anyone can view recent active posts"
  on public.rider_open_posts for select
  using (
    status = 'active'
    and last_seen_at >= now() - interval '2 minutes'
    or host_uid = auth.uid()::text
  );

drop policy if exists "host can insert post" on public.rider_open_posts;
create policy "host can insert post"
  on public.rider_open_posts for insert
  with check (host_uid = auth.uid()::text);

drop policy if exists "host can update post" on public.rider_open_posts;
create policy "host can update post"
  on public.rider_open_posts for update
  using (host_uid = auth.uid()::text)
  with check (host_uid = auth.uid()::text);

-- ------------------------------------------------------------------------------
-- Policies for join_requests:
-- ------------------------------------------------------------------------------
-- Privacy Requirement: Requester location MUST be NULL at insert
drop policy if exists "requester can insert join request without location" on public.join_requests;
create policy "requester can insert join request without location"
  on public.join_requests for insert
  with check (
    requester_uid = auth.uid()::text
    and requester_lat is null
    and requester_lng is null
  );

drop policy if exists "host or requester can view join requests" on public.join_requests;
create policy "host or requester can view join requests"
  on public.join_requests for select
  using (
    requester_uid = auth.uid()::text
    or exists (
      select 1 from public.rider_open_posts
      where id = join_requests.post_id and host_uid = auth.uid()::text
    )
  );

drop policy if exists "host or requester can update join request" on public.join_requests;
create policy "host or requester can update join request"
  on public.join_requests for update
  using (
    requester_uid = auth.uid()::text
    or exists (
      select 1 from public.rider_open_posts
      where id = join_requests.post_id and host_uid = auth.uid()::text
    )
  )
  with check (
    (
      exists (
        select 1 from public.rider_open_posts
        where id = join_requests.post_id and host_uid = auth.uid()::text
      )
    )
    or (
      requester_uid = auth.uid()::text
      and (status = 'cancelled' or (status = 'accepted' and requester_lat is not null))
    )
  );

-- ------------------------------------------------------------------------------
-- Policies for ride_messages:
-- ------------------------------------------------------------------------------
drop policy if exists "matched participants can view messages" on public.ride_messages;
create policy "matched participants can view messages"
  on public.ride_messages for select
  using (
    exists (
      select 1 from public.rider_open_posts p
      where p.id = ride_messages.post_id
      and (
        p.host_uid = auth.uid()::text
        or exists (
          select 1 from public.join_requests j
          where j.post_id = p.id and j.requester_uid = auth.uid()::text and j.status = 'accepted'
        )
      )
    )
  );

drop policy if exists "matched participants can send messages" on public.ride_messages;
create policy "matched participants can send messages"
  on public.ride_messages for insert
  with check (
    sender_uid = auth.uid()::text
    and exists (
      select 1 from public.rider_open_posts p
      where p.id = ride_messages.post_id
      and (
        p.host_uid = auth.uid()::text
        or exists (
          select 1 from public.join_requests j
          where j.post_id = p.id and j.requester_uid = auth.uid()::text and j.status = 'accepted'
        )
      )
    )
  );

-- ------------------------------------------------------------------------------
-- Policies for rider_sos_events:
-- ------------------------------------------------------------------------------
drop policy if exists "rider can insert sos" on public.rider_sos_events;
create policy "rider can insert sos"
  on public.rider_sos_events for insert
  with check (triggered_by_uid = auth.uid()::text);

drop policy if exists "matched riders can view sos" on public.rider_sos_events;
create policy "matched riders can view sos"
  on public.rider_sos_events for select
  using (
    triggered_by_uid = auth.uid()::text
    or exists (
      select 1 from public.rider_open_posts p
      where p.id = rider_sos_events.post_id
      and (
        p.host_uid = auth.uid()::text
        or exists (
          select 1 from public.join_requests j
          where j.post_id = p.id and j.requester_uid = auth.uid()::text and j.status = 'accepted'
        )
      )
    )
  );

-- ------------------------------------------------------------------------------
-- Realtime Publication
-- ------------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.rider_open_posts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.join_requests;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ride_messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rider_sos_events;
exception when others then null;
end $$;
