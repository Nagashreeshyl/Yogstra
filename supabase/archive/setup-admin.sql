-- ============================================================
-- Yogstra: Grant admin role to a specific user
-- ============================================================
-- PREREQUISITE: Create the auth user in Supabase Dashboard FIRST:
--   1. Supabase → Authentication → Users → Add user
--   2. Email: nagashreeshyl@gmail.com
--   3. Password: (your chosen password)
--   4. Enable "Auto Confirm User"
--   5. Click Create user
--
-- THEN run this entire script in SQL Editor.
-- ============================================================

-- Create or update profile with admin role
insert into public.profiles (id, role, full_name)
select
  id,
  'admin',
  coalesce(raw_user_meta_data->>'full_name', 'Admin')
from auth.users
where email = 'nagashreeshyl@gmail.com'
on conflict (id) do update
set role = 'admin';

-- Verify (should return one row with role = admin)
select p.id, u.email, p.role, p.full_name
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'nagashreeshyl@gmail.com';
