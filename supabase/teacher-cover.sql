-- Teacher card cover image (shown on Find Teachers page)
-- Run once in Supabase SQL Editor

alter table teacher_profiles
  add column if not exists cover_url text;
