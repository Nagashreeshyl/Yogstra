-- ============================================================
-- Yogstra: RESET ALL DATA (keep admin only)
-- ============================================================
-- ⚠️  DESTRUCTIVE — deletes every user, chat, booking, post,
--     coupon, notification, and uploaded file except ONE admin.
--
-- PREREQUISITE: Admin auth user must exist (see setup-admin.sql).
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- After running: sign up / register fresh test accounts from scratch.
--
-- STORAGE (optional, separate step — SQL cannot delete storage files):
--   Dashboard → Storage → open each bucket → select all → Delete
--   Buckets: post-media, avatars (keep admin folder if you want)
-- ============================================================

do $$
declare
  admin_email text := 'nagashreeshyl@gmail.com'; -- ← change if your admin email differs
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where email = admin_email;

  if admin_user_id is null then
    raise exception
      'Admin user % not found in auth.users. Create the user in Authentication → Users, then run setup-admin.sql first.',
      admin_email;
  end if;

  -- ── 1. Application data (order-safe; CASCADE handles FK chains) ──
  truncate table
    coupon_deliveries,
    teacher_notifications,
    class_orders,
    chat_thread_settings,
    chat_thread_reads,
    direct_messages,
    chat_reports,
    chat_threads,
    teacher_coupons,
    comments,
    messages,
    schedules,
    bookings,
    payouts,
    posts,
    teacher_profiles
  restart identity cascade;

  -- ── 2. Non-admin profiles ──
  delete from public.profiles
  where id <> admin_user_id;

  -- ── 3. Non-admin auth users (sessions, identities cascade) ──
  delete from auth.users
  where id <> admin_user_id;

  -- ── 4. Ensure admin profile + role ──
  insert into public.profiles (id, role, full_name)
  values (
    admin_user_id,
    'admin',
    coalesce(
      (select raw_user_meta_data->>'full_name' from auth.users where id = admin_user_id),
      'Admin'
    )
  )
  on conflict (id) do update
  set role = 'admin';

  raise notice 'Reset complete. Admin kept: % (%)', admin_email, admin_user_id;
  raise notice 'Optional: clear Storage buckets (post-media, avatars) in Dashboard → Storage.';
end $$;

-- ── Verify ──
select 'auth.users' as table_name, count(*) as rows from auth.users
union all
select 'profiles', count(*) from public.profiles
union all
select 'profiles (admin)', count(*) from public.profiles where role = 'admin'
union all
select 'chat_threads', count(*) from public.chat_threads
union all
select 'direct_messages', count(*) from public.direct_messages
union all
select 'bookings', count(*) from public.bookings
union all
select 'class_orders', count(*) from public.class_orders
union all
select 'teacher_coupons', count(*) from public.teacher_coupons
union all
select 'posts', count(*) from public.posts;

-- Expected: auth.users = 1, profiles = 1, everything else = 0
select u.email, p.role, p.full_name
from auth.users u
join public.profiles p on p.id = u.id;
