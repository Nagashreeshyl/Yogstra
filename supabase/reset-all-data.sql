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
--   Buckets: post-media, avatars
-- ============================================================

do $$
declare
  admin_email text := 'nagashreeshyl@gmail.com'; -- ← change if your admin email differs
  admin_user_id uuid;
  tables text[] := array[
    'coupon_deliveries',
    'teacher_notifications',
    'class_orders',
    'chat_thread_settings',
    'chat_thread_reads',
    'direct_messages',
    'chat_reports',
    'chat_threads',
    'teacher_coupons',
    'comments',
    'messages',
    'schedules',
    'bookings',
    'payouts',
    'posts',
    'teacher_payout_private',
    'schedule_change_requests',
    'class_sessions',
    'direct_video_calls',
    'teacher_profiles'
  ];
  existing_tables text;
begin
  select id into admin_user_id
  from auth.users
  where email = admin_email;

  if admin_user_id is null then
    raise exception
      'Admin user % not found in auth.users. Create the user in Authentication → Users, then run setup-admin.sql first.',
      admin_email;
  end if;

  -- Truncate only tables that exist (skips migrations you have not run yet)
  select string_agg(format('public.%I', t.table_name), ', ' order by t.table_name)
  into existing_tables
  from unnest(tables) as wanted(table_name)
  join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = wanted.table_name;

  if existing_tables is not null then
    execute 'truncate table ' || existing_tables || ' restart identity cascade';
    raise notice 'Truncated: %', existing_tables;
  else
    raise notice 'No application tables found to truncate.';
  end if;

  delete from public.profiles
  where id <> admin_user_id;

  delete from auth.users
  where id <> admin_user_id;

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

-- ── Verify (safe even if some tables were never created) ──
select 'auth.users' as table_name, count(*)::bigint as rows from auth.users
union all
select 'profiles', count(*) from public.profiles
union all
select 'profiles (admin)', count(*) from public.profiles where role = 'admin';

select u.email, p.role, p.full_name
from auth.users u
join public.profiles p on p.id = u.id;

-- Expected: auth.users = 1, profiles = 1, admin row shown above
