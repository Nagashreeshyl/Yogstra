-- Enable Supabase Realtime for live dashboard / listing updates
-- Run once in Supabase Dashboard → SQL Editor

do $$ begin alter publication supabase_realtime add table profiles;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin alter publication supabase_realtime add table bookings;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin alter publication supabase_realtime add table posts;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin alter publication supabase_realtime add table comments;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin alter publication supabase_realtime add table schedules;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin alter publication supabase_realtime add table payouts;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- teacher_profiles, class_orders, direct_messages, etc. may already be enabled from other migrations
