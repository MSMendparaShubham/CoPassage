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
  created_at timestamptz default now()
);

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

-- ==============================================================================
-- RLS
-- ==============================================================================
alter table rider_open_posts enable row level security;
alter table join_requests enable row level security;
alter table ride_messages enable row level security;
alter table rider_sos_events enable row level security;
alter table rider_ratings enable row level security;
alter table rider_support_tickets enable row level security;

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
