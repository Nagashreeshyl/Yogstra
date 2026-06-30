-- One-time production reset: wipe all user-generated data, keep admin + system config.
-- Admin preserved: bd83daa6-d98e-4f21-ac99-3e4119150bbf (nagashreeshyl@gmail.com)
-- Run manually via Supabase SQL editor or MCP execute_sql — NOT applied on deploy.

DO $$
DECLARE
  admin_id uuid := 'bd83daa6-d98e-4f21-ac99-3e4119150bbf';
BEGIN
  -- Storage: direct DELETE on storage.objects is blocked by Supabase.
  -- Clear buckets via Dashboard > Storage or Storage API after this script runs.

  -- Beta / audit / analytics logs
  TRUNCATE TABLE
    public.platform_analytics_events,
    public.beta_feedback,
    public.admin_audit_log,
    public.platform_activity_log
  RESTART IDENTITY CASCADE;

  -- Enrollment notifications
  TRUNCATE TABLE public.enrollment_notifications RESTART IDENTITY CASCADE;

  -- Competition domain (children first via CASCADE from competitions)
  TRUNCATE TABLE
    public.competition_scores,
    public.competition_results,
    public.competition_certificates,
    public.competition_rankings,
    public.competition_announcements,
    public.competition_judges,
    public.competition_participants,
    public.competition_registrations,
    public.competition_divisions,
    public.competition_categories,
    public.competition_events,
    public.competitions
  RESTART IDENTITY CASCADE;

  -- Academy domain
  TRUNCATE TABLE
    public.batch_students,
    public.batches,
    public.academy_members,
    public.teacher_academies,
    public.academy_settings,
    public.academies
  RESTART IDENTITY CASCADE;

  -- Teacher platform
  TRUNCATE TABLE
    public.coupon_deliveries,
    public.teacher_coupons,
    public.teacher_notifications,
    public.schedule_change_requests,
    public.class_sessions
  RESTART IDENTITY CASCADE;

  -- Chat, orders, video calls
  TRUNCATE TABLE
    public.chat_reports,
    public.direct_messages,
    public.chat_thread_reads,
    public.chat_thread_settings,
    public.chat_threads,
    public.class_orders,
    public.direct_video_calls
  RESTART IDENTITY CASCADE;

  -- Community & marketplace
  TRUNCATE TABLE
    public.comments,
    public.posts,
    public.messages,
    public.schedules,
    public.bookings,
    public.payouts,
    public.teacher_payout_private
  RESTART IDENTITY CASCADE;

  -- Teacher profiles (all; admin has no teacher row)
  TRUNCATE TABLE public.teacher_profiles RESTART IDENTITY CASCADE;

  -- Profile preferences for non-admin
  DELETE FROM public.profile_preferences WHERE user_id <> admin_id;
  DELETE FROM public.profiles WHERE id <> admin_id;
  DELETE FROM auth.users WHERE id <> admin_id;

  -- Ensure admin profile is intact
  INSERT INTO public.profiles (id, role, full_name)
  SELECT admin_id, 'admin', coalesce(u.raw_user_meta_data->>'full_name', u.email)
  FROM auth.users u
  WHERE u.id = admin_id
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();

  INSERT INTO public.profile_preferences (user_id, preferred_workspace)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET preferred_workspace = 'admin',
      preferred_academy_id = null,
      updated_at = now();
END $$;
