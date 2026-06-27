-- Teacher class pricing (1v1 / group × week / month)
-- Run in Supabase Dashboard → SQL Editor (safe to re-run)

alter table teacher_profiles
  add column if not exists fee_1v1_week numeric,
  add column if not exists fee_1v1_month numeric,
  add column if not exists fee_group_week numeric,
  add column if not exists fee_group_month numeric;

alter table class_orders
  add column if not exists duration text check (duration is null or duration in ('week', 'month'));
