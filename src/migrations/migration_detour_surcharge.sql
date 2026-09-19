-- Migration: Add detour surcharge tracking columns to join_requests
-- These columns support the 500m destination gate + detour surcharge consent flow.
-- The surcharge is DISPLAY-ONLY (settled offline between riders) — NOT collected by CoPassage.

alter table join_requests
  add column if not exists detour_excess_km numeric,
  add column if not exists detour_surcharge_amount numeric default 0,
  add column if not exists detour_surcharge_accepted boolean default false,
  add column if not exists detour_surcharge_accepted_at timestamptz;
