-- Allow admin to mark teachers as removed (run in Supabase SQL Editor)

alter table teacher_profiles drop constraint if exists teacher_profiles_status_check;

alter table teacher_profiles
  add constraint teacher_profiles_status_check
  check (status in ('pending', 'verified', 'rejected', 'removed'));
