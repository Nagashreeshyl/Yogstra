-- Optional gender on profiles (for sir/ma'am in student intro messages)
-- Run in Supabase Dashboard → SQL Editor (safe to re-run)

alter table profiles
  add column if not exists gender text
  check (gender is null or gender in ('male', 'female'));
