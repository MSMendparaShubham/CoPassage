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
  destination_lat double precision,
  destination_lng double precision,
  fare numeric not null,
  seats_available integer not null default 2,
  current_lat double precision not null,
  current_lng double precision not null,
  status text not null default 'active' check (status in ('active', 'matched', 'completed', 'cancelled')),
  host_marked_complete boolean not null default false,
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
  rider_marked_complete boolean not null default false,
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

-- 6. rider_ratings (Post-ride commuter-to-commuter reviews)
create table if not exists public.rider_ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.rider_open_posts(id) on delete cascade,
  rater_uid text not null,
  rated_uid text not null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.rider_open_posts enable row level security;
alter table public.join_requests enable row level security;
alter table public.ride_messages enable row level security;
alter table public.rider_sos_events enable row level security;
alter table public.rider_ratings enable row level security;

-- ==============================================================================
-- Policies for rider_open_posts:
-- ==============================================================================
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

-- Host-only UPDATE: co-riders NEVER get UPDATE on this table.
-- Completion status is set by the SECURITY DEFINER trigger, not by clients.
drop policy if exists "host can update post" on public.rider_open_posts;
create policy "host can update post"
  on public.rider_open_posts for update
  using (host_uid = auth.uid()::text)
  with check (host_uid = auth.uid()::text);

-- ==============================================================================
-- Policies for join_requests:
-- ==============================================================================
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

-- Tightened policy for co-rider completion flag updates
drop policy if exists "requester updates own completion flag" on public.join_requests;
create policy "requester updates own completion flag"
  on public.join_requests for update
  using (requester_uid = auth.uid()::text and status = 'accepted')
  with check (requester_uid = auth.uid()::text and status = 'accepted');

-- ==============================================================================
-- Policies for ride_messages:
-- ==============================================================================
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

-- ==============================================================================
-- Policies for rider_sos_events:
-- ==============================================================================
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

-- ==============================================================================
-- Policies for rider_ratings:
-- ==============================================================================
drop policy if exists "rider can review their own completed ride" on public.rider_ratings;
create policy "rider can review their own completed ride"
  on public.rider_ratings for insert
  with check (
    rater_uid = auth.uid()::text
    and exists (
      select 1 from public.rider_open_posts p
      left join public.join_requests jr on jr.post_id = p.id
      where p.id = rider_ratings.post_id
        and p.status = 'completed'
        and (
          p.host_uid = auth.uid()::text
          or (jr.requester_uid = auth.uid()::text and jr.status = 'accepted')
        )
    )
  );

drop policy if exists "rider reads own received ratings" on public.rider_ratings;
create policy "rider reads own received ratings"
  on public.rider_ratings for select
  using (rated_uid = auth.uid()::text);

drop policy if exists "rider reads own given ratings" on public.rider_ratings;
create policy "rider reads own given ratings"
  on public.rider_ratings for select
  using (rater_uid = auth.uid()::text);

-- ==============================================================================
-- SECURITY DEFINER Trigger: Atomically complete ride when both flags are true
-- ==============================================================================
create or replace function public.check_and_complete_ride()
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
  if tg_table_name = 'rider_open_posts' then
    v_post_id := new.id;
  elsif tg_table_name = 'join_requests' then
    v_post_id := new.post_id;
  end if;

  -- Check host completion flag
  select host_marked_complete into v_host_complete
  from public.rider_open_posts
  where id = v_post_id;

  -- Check co-rider completion flag on accepted join request
  select exists (
    select 1 from public.join_requests
    where post_id = v_post_id
      and status = 'accepted'
      and rider_marked_complete = true
  ) into v_rider_complete;

  -- Atomically flip status when both have confirmed
  if v_host_complete is true and v_rider_complete is true then
    update public.rider_open_posts
    set status = 'completed'
    where id = v_post_id and status != 'completed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_complete_host on public.rider_open_posts;
create trigger trg_check_complete_host
after update of host_marked_complete on public.rider_open_posts
for each row
execute function public.check_and_complete_ride();

drop trigger if exists trg_check_complete_rider on public.join_requests;
create trigger trg_check_complete_rider
after update of rider_marked_complete on public.join_requests
for each row
execute function public.check_and_complete_ride();

-- ==============================================================================
-- 10-Minute Timeout Fallback Function (called via supabase.rpc())
-- ==============================================================================
create or replace function public.auto_complete_abandoned_ride(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_uid text := auth.uid()::text;
  v_is_host boolean;
  v_is_accepted_rider boolean;
begin
  select (host_uid = v_caller_uid) into v_is_host
  from public.rider_open_posts where id = p_post_id;

  select exists (
    select 1 from public.join_requests
    where post_id = p_post_id and requester_uid = v_caller_uid and status = 'accepted'
  ) into v_is_accepted_rider;

  if (v_is_host is true or v_is_accepted_rider is true) then
    update public.rider_open_posts
    set status = 'completed'
    where id = p_post_id and status != 'completed';
  end if;
end;
$$;

-- ==============================================================================
-- Realtime Publication
-- ==============================================================================
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

do $$
begin
  alter publication supabase_realtime add table public.rider_ratings;
exception when others then null;
end $$;
