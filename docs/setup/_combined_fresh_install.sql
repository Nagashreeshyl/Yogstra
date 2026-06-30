
-- Temporary stub so RLS policies in 001 can reference is_admin before profiles exists
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select false $$;


-- Yogstra V2 — Migration 000: extensions and shared helpers
-- Idempotent. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Shared timestamp helper (used by academy, competition, and core patches)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Auth signup trigger — creates profile (+ teacher_profiles when role=teacher)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  insert into public.profiles (id, role, full_name, phone, city, state)
  values (
    new.id,
    user_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'state', '')
  )
  on conflict (id) do nothing;

  if user_role = 'teacher' then
    insert into public.teacher_profiles (
      id, bio, experience_years, monthly_fee, certifications, specializations, status
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'bio', ''),
      coalesce(new.raw_user_meta_data->>'experience_years', ''),
      coalesce((new.raw_user_meta_data->>'monthly_fee')::numeric, 0),
      coalesce(new.raw_user_meta_data->>'certifications', ''),
      coalesce(
        case
          when jsonb_typeof(new.raw_user_meta_data->'specializations') = 'array' then
            array(select jsonb_array_elements_text(new.raw_user_meta_data->'specializations'))
          else '{}'::text[]
        end,
        '{}'::text[]
      ),
      'pending'
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Yogstra V2 — Migration 001: core schema (profiles, marketplace base, community)
-- Consolidates: schema.sql, profile-gender.sql, admin-community-posts.sql, booking-student-policies.sql

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('student', 'teacher', 'admin')),
  full_name text,
  phone text,
  city text,
  state text,
  avatar_url text,
  gender text check (gender is null or gender in ('male', 'female')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Teacher profiles (public-facing; payout data lives in teacher_payout_private)
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  experience_years text,
  monthly_fee numeric,
  fee_group numeric,
  fee_1v1_week numeric,
  fee_1v1_month numeric,
  fee_group_week numeric,
  fee_group_month numeric,
  certifications text,
  rating numeric default 0,
  total_students integer default 0,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'removed')),
  specializations text[],
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings & schedules
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'active',
  payment_status text not null default 'pending',
  monthly_fee numeric,
  start_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  class_type text check (class_type in ('1:1', 'group')),
  scheduled_at timestamptz,
  duration_minutes integer default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  content text,
  media_url text,
  media_type text check (media_type is null or media_type in ('image', 'video')),
  likes integer not null default 0,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Legacy booking-scoped messages (parallel to direct_messages)
-- ---------------------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payout ledger (extended in migration 003)
-- ---------------------------------------------------------------------------

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  amount numeric,
  period text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_teacher_profiles_status on public.teacher_profiles(status);
create index if not exists idx_bookings_student on public.bookings(student_id);
create index if not exists idx_bookings_teacher on public.bookings(teacher_id);
create index if not exists idx_schedules_teacher_at on public.schedules(teacher_id, scheduled_at);
create index if not exists idx_schedules_student on public.schedules(student_id);
create index if not exists idx_posts_author on public.posts(author_id, created_at desc);
create index if not exists idx_posts_pinned_created on public.posts(pinned desc, created_at desc);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_messages_booking on public.messages(booking_id, created_at);
create index if not exists idx_payouts_teacher on public.payouts(teacher_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$ declare t text; begin
  foreach t in array array[
    'categories', 'profiles', 'teacher_profiles', 'bookings', 'schedules',
    'posts', 'comments', 'messages', 'payouts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security — core
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.schedules enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.messages enable row level security;
alter table public.payouts enable row level security;

do $$ begin create policy "Public profiles are viewable by everyone" on public.profiles for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can upsert own profile" on public.profiles for update using (auth.uid() = id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage profiles" on public.profiles for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teacher profiles viewable by everyone" on public.teacher_profiles for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers can insert own teacher profile" on public.teacher_profiles for insert with check (auth.uid() = id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers can upsert own teacher profile" on public.teacher_profiles for update using (auth.uid() = id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage teacher profiles" on public.teacher_profiles for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Posts viewable by everyone" on public.posts for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Authenticated users can post" on public.posts for insert with check (auth.uid() = author_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update posts" on public.posts for update using (is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can delete posts" on public.posts for delete using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Comments viewable by everyone" on public.comments for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Authenticated users can comment" on public.comments for insert with check (auth.uid() = author_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Categories viewable by everyone" on public.categories for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage categories" on public.categories for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students can create paid bookings" on public.bookings for insert with check (auth.uid() = student_id and status = 'active' and payment_status = 'paid'); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students can activate own bookings after payment" on public.bookings for update using (auth.uid() = student_id and status = 'pending') with check (auth.uid() = student_id and status = 'active' and payment_status = 'paid'); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers can update own booking status" on public.bookings for update using (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage bookings" on public.bookings for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view relevant schedules" on public.schedules for select using (auth.uid() = teacher_id or auth.uid() = student_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers can manage own schedules" on public.schedules for insert with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage schedules" on public.schedules for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view own messages" on public.messages for select using (
  auth.uid() = sender_id or is_admin() or auth.uid() in (
    select student_id from public.bookings where id = booking_id
    union select teacher_id from public.bookings where id = booking_id
  )
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can send messages on active bookings" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.bookings b where b.id = booking_id and b.status = 'active'
      and (b.student_id = auth.uid() or b.teacher_id = auth.uid())
  )
); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers and admin can view payouts" on public.payouts for select using (is_admin() or auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can manage payouts" on public.payouts for update using (is_admin()); exception when duplicate_object then null; end $$;

-- Seed default categories (once)
insert into public.categories (name, icon)
select * from (values
  ('Basic Yoga', 'Flower2'),
  ('Intermediate Yoga', 'Activity'),
  ('Advanced Yoga', 'Flame'),
  ('Competition Yoga', 'Trophy'),
  ('Aerial Yoga', 'Wind'),
  ('Kriya Yoga', 'Sparkles'),
  ('Yoga for Seniors', 'Heart'),
  ('Prenatal Yoga', 'Baby')
) as v(name, icon)
where not exists (select 1 from public.categories limit 1);


-- Yogstra V2 — Migration 002: chat, class orders, reports, video calls
-- Consolidates: setup-messaging.sql, chat-reports.sql, chat-enhancements.sql,
--                 direct-video-calls.sql, messages-realtime.sql (legacy messages policy)

-- ---------------------------------------------------------------------------
-- Chat threads & direct messages
-- ---------------------------------------------------------------------------

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  history_cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_ordered check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  edited_at timestamptz,
  edited_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  delete_scope text check (delete_scope is null or delete_scope in ('self', 'both')),
  hidden_for uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_thread_reads (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_thread_settings (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted boolean not null default false,
  blocked boolean not null default false,
  hidden boolean not null default false,
  history_cleared_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  messages_snapshot jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Class orders (Razorpay checkout)
-- ---------------------------------------------------------------------------

create table if not exists public.class_orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid references public.chat_threads(id) on delete set null,
  class_type text not null check (class_type in ('1:1', 'group')),
  duration text check (duration is null or duration in ('week', 'month')),
  scheduled_at timestamptz not null,
  notes text,
  amount numeric not null,
  gross_amount numeric,
  platform_fee numeric,
  teacher_amount numeric,
  commission_percent numeric,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  transfer_status text default 'pending'
    check (transfer_status in ('pending', 'transferred', 'held', 'not_applicable')),
  schedule_id uuid references public.schedules(id) on delete set null,
  discount_percent numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists class_orders_razorpay_order_id_idx
  on public.class_orders (razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists class_orders_razorpay_payment_id_idx
  on public.class_orders (razorpay_payment_id) where razorpay_payment_id is not null;

-- ---------------------------------------------------------------------------
-- Direct video calls
-- ---------------------------------------------------------------------------

create table if not exists public.direct_video_calls (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists direct_messages_thread_id_idx on public.direct_messages(thread_id);
create index if not exists chat_threads_participant_a_idx on public.chat_threads(participant_a);
create index if not exists chat_threads_participant_b_idx on public.chat_threads(participant_b);
create index if not exists chat_thread_reads_user_id_idx on public.chat_thread_reads(user_id);
create index if not exists chat_reports_thread_id_idx on public.chat_reports(thread_id);
create index if not exists chat_reports_status_idx on public.chat_reports(status);
create index if not exists class_orders_teacher_id_idx on public.class_orders(teacher_id);
create index if not exists class_orders_student_id_idx on public.class_orders(student_id);
create index if not exists direct_video_calls_thread_idx on public.direct_video_calls(thread_id, created_at desc);
create index if not exists direct_video_calls_caller_idx on public.direct_video_calls(caller_id, created_at desc);
create index if not exists direct_video_calls_callee_idx on public.direct_video_calls(callee_id, created_at desc);
create index if not exists direct_video_calls_status_idx on public.direct_video_calls(status);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$ declare t text; begin
  foreach t in array array[
    'chat_threads', 'direct_messages', 'chat_reports', 'class_orders', 'direct_video_calls'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

drop trigger if exists trg_chat_thread_settings_updated_at on public.chat_thread_settings;
create trigger trg_chat_thread_settings_updated_at
  before update on public.chat_thread_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.chat_threads enable row level security;
alter table public.direct_messages enable row level security;
alter table public.chat_thread_reads enable row level security;
alter table public.chat_thread_settings enable row level security;
alter table public.chat_reports enable row level security;
alter table public.class_orders enable row level security;
alter table public.direct_video_calls enable row level security;

do $$ begin create policy "Users can view own chat threads" on public.chat_threads for select using (auth.uid() = participant_a or auth.uid() = participant_b or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can create chat threads" on public.chat_threads for insert with check (auth.uid() = requested_by and (auth.uid() = participant_a or auth.uid() = participant_b)); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update chat threads" on public.chat_threads for update using (auth.uid() = participant_a or auth.uid() = participant_b or is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view direct messages in their threads" on public.direct_messages for select using (
  is_admin() or exists (select 1 from public.chat_threads t where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid()) and t.status = 'accepted')
  or (auth.uid() = sender_id and exists (select 1 from public.chat_threads t where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can send direct messages in accepted threads" on public.direct_messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.chat_threads t where t.id = thread_id and t.status = 'accepted' and (t.participant_a = auth.uid() or t.participant_b = auth.uid()))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update own direct messages" on public.direct_messages for update using (auth.uid() = sender_id) with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update direct messages" on public.direct_messages for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view own read state" on public.chat_thread_reads for select using (auth.uid() = user_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can upsert own read state" on public.chat_thread_reads for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update own read state" on public.chat_thread_reads for update using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users manage own thread settings" on public.chat_thread_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can view thread settings" on public.chat_thread_settings for select using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Participants can submit chat reports" on public.chat_reports for insert with check (
  auth.uid() = reporter_id and exists (select 1 from public.chat_threads t where t.id = thread_id and t.status = 'accepted' and (t.participant_a = auth.uid() or t.participant_b = auth.uid()))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Reporters can view own reports" on public.chat_reports for select using (auth.uid() = reporter_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update chat reports" on public.chat_reports for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Students can create class orders" on public.class_orders for insert with check (auth.uid() = student_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can view own class orders" on public.class_orders for select using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students can update own pending orders" on public.class_orders for update using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Call participants can view calls" on public.direct_video_calls for select using (auth.uid() = caller_id or auth.uid() = callee_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Call participants can create calls" on public.direct_video_calls for insert with check (auth.uid() = caller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Call participants can update calls" on public.direct_video_calls for update using (auth.uid() = caller_id or auth.uid() = callee_id or is_admin()); exception when duplicate_object then null; end $$;

-- Schedule insert policies (class orders + teacher flows)
do $$ begin create policy "Teachers insert schedules from paid orders" on public.schedules for insert with check (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students insert schedules for paid class orders" on public.schedules for insert with check (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;

alter table public.direct_video_calls replica identity full;


-- Yogstra V2 — Migration 003: marketplace, payouts, private teacher payout data
-- Consolidates: marketplace-payouts.sql, security-hardening.sql, teacher-upi-payouts.sql
-- Payout bank/UPI data lives ONLY in teacher_payout_private (not teacher_profiles).

create table if not exists public.platform_settings (
  id text primary key default 'default',
  commission_percent numeric not null default 10
    check (commission_percent >= 0 and commission_percent <= 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.platform_settings (id, commission_percent)
values ('default', 10)
on conflict (id) do nothing;

create table if not exists public.teacher_payout_private (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  account_holder_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  upi_id text,
  razorpay_linked_account_id text,
  payout_onboarding_status text not null default 'not_started'
    check (payout_onboarding_status in ('not_started', 'pending', 'active', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend payouts ledger
alter table public.payouts
  add column if not exists class_order_id uuid references public.class_orders(id) on delete set null,
  add column if not exists student_id uuid references public.profiles(id) on delete set null,
  add column if not exists gross_amount numeric,
  add column if not exists commission_amount numeric,
  add column if not exists teacher_amount numeric,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_transfer_id text;

create unique index if not exists payouts_class_order_id_idx
  on public.payouts (class_order_id) where class_order_id is not null;

-- Remove duplicate payout columns from teacher_profiles if legacy migrations added them
alter table public.teacher_profiles
  drop column if exists account_holder_name,
  drop column if exists bank_account_number,
  drop column if exists bank_ifsc,
  drop column if exists pan_number,
  drop column if exists razorpay_linked_account_id,
  drop column if exists payout_onboarding_status,
  drop column if exists upi_id;

drop trigger if exists trg_teacher_payout_private_updated_at on public.teacher_payout_private;
create trigger trg_teacher_payout_private_updated_at
  before update on public.teacher_payout_private
  for each row execute function public.set_updated_at();

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.teacher_payout_private enable row level security;

do $$ begin create policy "Anyone authenticated can read platform settings" on public.platform_settings for select using (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update platform settings" on public.platform_settings for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers read own payout private data" on public.teacher_payout_private for select using (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers update own payout private data" on public.teacher_payout_private for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers insert own payout private data" on public.teacher_payout_private for insert with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin manage payout private data" on public.teacher_payout_private for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Admin can insert payouts" on public.payouts for insert with check (is_admin()); exception when duplicate_object then null; end $$;


-- Yogstra V2 — Migration 004: teacher coupons, notifications, schedule changes, live classes
-- Consolidates: teacher-coupons.sql, teacher-coupons-limits.sql, teacher-notifications.sql,
--               schedule-change-requests.sql, class-sessions.sql, teacher-policies.sql

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_coupons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  class_type text not null check (class_type in ('1:1', 'group')),
  duration text not null check (duration in ('week', 'month')),
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  valid_until timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_deliveries (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.teacher_coupons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  used_at timestamptz,
  order_id uuid references public.class_orders(id) on delete set null,
  unique (coupon_id, student_id)
);

alter table public.class_orders
  add column if not exists coupon_id uuid references public.teacher_coupons(id) on delete set null;

create or replace function public.user_owns_teacher_coupon(p_coupon_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.teacher_coupons where id = p_coupon_id and teacher_id = auth.uid());
$$;

create or replace function public.student_received_coupon(p_coupon_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.coupon_deliveries where coupon_id = p_coupon_id and student_id = auth.uid());
$$;

grant execute on function public.user_owns_teacher_coupon(uuid) to authenticated;
grant execute on function public.student_received_coupon(uuid) to authenticated;

create or replace function public.redeem_coupon(p_delivery_id uuid, p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_coupon_id uuid; v_max integer; v_count integer;
begin
  select coupon_id into v_coupon_id from public.coupon_deliveries where id = p_delivery_id and student_id = auth.uid();
  if v_coupon_id is null then raise exception 'Invalid coupon delivery'; end if;
  select max_uses, use_count into v_max, v_count from public.teacher_coupons where id = v_coupon_id for update;
  if v_max is not null and v_count >= v_max then raise exception 'Coupon usage limit reached'; end if;
  update public.coupon_deliveries set used_at = now(), order_id = p_order_id where id = p_delivery_id;
  update public.teacher_coupons set use_count = use_count + 1 where id = v_coupon_id;
end;
$$;

grant execute on function public.redeem_coupon(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications & schedule change requests
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_notifications (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.class_orders(id) on delete set null,
  request_id uuid,
  type text not null default 'class_booking',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_order_id uuid references public.class_orders(id) on delete set null,
  schedule_id uuid references public.schedules(id) on delete set null,
  scope text not null check (scope in ('1_day', '2_days', '3_days', 'permanent')),
  current_scheduled_at timestamptz not null,
  requested_date date not null,
  requested_time text not null,
  student_note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  teacher_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.teacher_notifications
  drop constraint if exists teacher_notifications_request_id_fkey;
alter table public.teacher_notifications
  add constraint teacher_notifications_request_id_fkey
  foreign key (request_id) references public.schedule_change_requests(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Live class sessions (LiveKit)
-- ---------------------------------------------------------------------------

create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  room_name text not null unique,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists teacher_coupons_teacher_id_idx on public.teacher_coupons(teacher_id, created_at desc);
create index if not exists teacher_coupons_code_idx on public.teacher_coupons(code);
create index if not exists teacher_coupons_valid_until_idx on public.teacher_coupons(valid_until) where is_active = true;
create index if not exists coupon_deliveries_student_id_idx on public.coupon_deliveries(student_id);
create index if not exists teacher_notifications_teacher_id_idx on public.teacher_notifications(teacher_id, created_at desc);
create index if not exists schedule_change_requests_teacher_idx on public.schedule_change_requests(teacher_id, status, created_at desc);
create index if not exists schedule_change_requests_student_idx on public.schedule_change_requests(student_id, status, created_at desc);
create index if not exists class_sessions_teacher_id_idx on public.class_sessions(teacher_id, created_at desc);
create index if not exists class_sessions_student_id_idx on public.class_sessions(student_id, created_at desc);
create index if not exists class_sessions_status_idx on public.class_sessions(status);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$ declare t text; begin
  foreach t in array array['teacher_coupons', 'teacher_notifications', 'schedule_change_requests', 'class_sessions'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.teacher_coupons enable row level security;
alter table public.coupon_deliveries enable row level security;
alter table public.teacher_notifications enable row level security;
alter table public.schedule_change_requests enable row level security;
alter table public.class_sessions enable row level security;

do $$ begin create policy "Teachers manage own coupons" on public.teacher_coupons for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students read coupons sent to them" on public.teacher_coupons for select using (public.student_received_coupon(id) or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin read coupons" on public.teacher_coupons for select using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers manage coupon deliveries" on public.coupon_deliveries for all using (public.user_owns_teacher_coupon(coupon_id)) with check (public.user_owns_teacher_coupon(coupon_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students read own coupon deliveries" on public.coupon_deliveries for select using (auth.uid() = student_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students mark own coupon used" on public.coupon_deliveries for update using (auth.uid() = student_id) with check (auth.uid() = student_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers read own notifications" on public.teacher_notifications for select using (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers mark own notifications read" on public.teacher_notifications for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students create booking notifications" on public.teacher_notifications for insert with check (exists (select 1 from public.class_orders where id = order_id and student_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students create schedule change notifications" on public.teacher_notifications for insert with check (auth.uid() = student_id and exists (select 1 from public.schedule_change_requests where id = request_id and student_id = auth.uid())); exception when duplicate_object then null; end $$;

do $$ begin create policy "Students manage own schedule change requests" on public.schedule_change_requests for all using (auth.uid() = student_id) with check (auth.uid() = student_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers view and resolve schedule change requests" on public.schedule_change_requests for select using (auth.uid() = teacher_id or auth.uid() = student_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers update schedule change requests" on public.schedule_change_requests for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers manage own class sessions" on public.class_sessions for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students view and respond to own sessions" on public.class_sessions for select using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students update own ringing sessions" on public.class_sessions for update using (auth.uid() = student_id) with check (auth.uid() = student_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers update own schedules" on public.schedules for update using (auth.uid() = teacher_id or is_admin()) with check (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;


-- Academy Foundation (V2 Core Domain)
-- Additive migration — does NOT modify or drop existing tables.
-- Run once in Supabase Dashboard → SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- Academies (supports future branches via parent_academy_id)
-- ---------------------------------------------------------------------------

create table if not exists academies (
  id uuid primary key default gen_random_uuid(),
  parent_academy_id uuid references academies(id) on delete set null,
  slug text not null,
  name text not null,
  description text,
  logo_url text,
  city text,
  state text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academies_slug_unique unique (slug),
  constraint academies_branch_not_self check (parent_academy_id is null or parent_academy_id <> id)
);

create index if not exists idx_academies_parent on academies(parent_academy_id);
create index if not exists idx_academies_status on academies(status);
create index if not exists idx_academies_created_by on academies(created_by);

-- ---------------------------------------------------------------------------
-- Academy settings (one row per academy root/branch)
-- ---------------------------------------------------------------------------

create table if not exists academy_settings (
  academy_id uuid primary key references academies(id) on delete cascade,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Academy members (staff / management roles)
-- ---------------------------------------------------------------------------

create table if not exists academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (
    role in (
      'owner',
      'manager',
      'teacher',
      'assistant_teacher',
      'receptionist',
      'finance_manager'
    )
  ),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'removed')),
  invited_by uuid references profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_members_unique_user unique (academy_id, user_id)
);

create index if not exists idx_academy_members_academy on academy_members(academy_id);
create index if not exists idx_academy_members_user on academy_members(user_id);
create index if not exists idx_academy_members_role on academy_members(academy_id, role);

-- ---------------------------------------------------------------------------
-- Teacher ↔ Academy affiliation (employed or independent affiliate)
-- ---------------------------------------------------------------------------

create table if not exists teacher_academies (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  employment_type text not null default 'affiliated'
    check (employment_type in ('employed', 'affiliated', 'visiting')),
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'removed')),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_academies_unique unique (academy_id, teacher_id)
);

create index if not exists idx_teacher_academies_academy on teacher_academies(academy_id);
create index if not exists idx_teacher_academies_teacher on teacher_academies(teacher_id);

-- ---------------------------------------------------------------------------
-- Batches
-- ---------------------------------------------------------------------------

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academies(id) on delete cascade,
  branch_id uuid references academies(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  capacity integer check (capacity is null or capacity > 0),
  difficulty text check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')),
  age_group text,
  language text default 'en',
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_batches_academy on batches(academy_id);
create index if not exists idx_batches_teacher on batches(teacher_id);
create index if not exists idx_batches_status on batches(academy_id, status);

-- ---------------------------------------------------------------------------
-- Batch students (academy enrollment)
-- ---------------------------------------------------------------------------

create table if not exists batch_students (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrollment_type text not null default 'academy'
    check (enrollment_type in ('academy', 'independent')),
  status text not null default 'active'
    check (status in ('active', 'transferred', 'graduated', 'removed')),
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batch_students_unique unique (batch_id, student_id)
);

create index if not exists idx_batch_students_batch on batch_students(batch_id);
create index if not exists idx_batch_students_student on batch_students(student_id);

-- ---------------------------------------------------------------------------
-- Optional future links on existing tables (nullable — no data migration)
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists academy_id uuid references academies(id) on delete set null;
alter table schedules add column if not exists batch_id uuid references batches(id) on delete set null;

create index if not exists idx_bookings_academy on bookings(academy_id) where academy_id is not null;
create index if not exists idx_schedules_batch on schedules(batch_id) where batch_id is not null;

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_academy_member(
  target_academy_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from academy_members am
    where am.academy_id = target_academy_id
      and am.user_id = auth.uid()
      and am.status = 'active'
      and (allowed_roles is null or am.role = any(allowed_roles))
  );
$$;

create or replace function public.is_academy_teacher(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from teacher_academies ta
    where ta.academy_id = target_academy_id
      and ta.teacher_id = auth.uid()
      and ta.status = 'active'
  )
  or is_academy_member(
    target_academy_id,
    array['owner', 'manager', 'teacher', 'assistant_teacher']
  );
$$;

create or replace function public.can_manage_academy(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin()
    or is_academy_member(target_academy_id, array['owner', 'manager']);
$$;

create or replace function public.can_view_academy(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin()
    or is_academy_member(target_academy_id)
    or is_academy_teacher(target_academy_id)
    or exists (
      select 1
      from batch_students bs
      join batches b on b.id = bs.batch_id
      where b.academy_id = target_academy_id
        and bs.student_id = auth.uid()
        and bs.status = 'active'
    );
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_academies_updated_at on academies;
create trigger trg_academies_updated_at
  before update on academies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_academy_members_updated_at on academy_members;
create trigger trg_academy_members_updated_at
  before update on academy_members
  for each row execute function public.set_updated_at();

drop trigger if exists trg_teacher_academies_updated_at on teacher_academies;
create trigger trg_teacher_academies_updated_at
  before update on teacher_academies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_batches_updated_at on batches;
create trigger trg_batches_updated_at
  before update on batches
  for each row execute function public.set_updated_at();

drop trigger if exists trg_batch_students_updated_at on batch_students;
create trigger trg_batch_students_updated_at
  before update on batch_students
  for each row execute function public.set_updated_at();

drop trigger if exists trg_academy_settings_updated_at on academy_settings;
create trigger trg_academy_settings_updated_at
  before update on academy_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table academies enable row level security;
alter table academy_settings enable row level security;
alter table academy_members enable row level security;
alter table teacher_academies enable row level security;
alter table batches enable row level security;
alter table batch_students enable row level security;

-- Academies
do $$ begin
  create policy "Public can view active academies"
    on academies for select
    using (status = 'active' or can_view_academy(id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Owners and managers can update academies"
    on academies for update
    using (can_manage_academy(id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can create academies"
    on academies for insert
    with check (auth.uid() is not null and created_by = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin manage academies"
    on academies for all
    using (is_admin());
exception when duplicate_object then null;
end $$;

-- Academy settings
do $$ begin
  create policy "Academy viewers can read settings"
    on academy_settings for select
    using (can_view_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Academy managers can manage settings"
    on academy_settings for all
    using (can_manage_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Academy members
do $$ begin
  create policy "Members can view academy roster"
    on academy_members for select
    using (can_view_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Managers can manage academy members"
    on academy_members for all
    using (can_manage_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Teacher academies
do $$ begin
  create policy "Academy viewers can read teacher affiliations"
    on teacher_academies for select
    using (can_view_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Managers can manage teacher affiliations"
    on teacher_academies for all
    using (can_manage_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read own affiliations"
    on teacher_academies for select
    using (teacher_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Batches
do $$ begin
  create policy "Academy viewers can read batches"
    on batches for select
    using (can_view_academy(academy_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Academy managers and teachers can manage batches"
    on batches for all
    using (
      is_admin()
      or can_manage_academy(academy_id)
      or (
        teacher_id = auth.uid()
        and is_academy_teacher(academy_id)
      )
    );
exception when duplicate_object then null;
end $$;

-- Batch students
do $$ begin
  create policy "Academy viewers can read batch students"
    on batch_students for select
    using (
      is_admin()
      or exists (
        select 1 from batches b
        where b.id = batch_students.batch_id
          and can_view_academy(b.academy_id)
      )
      or student_id = auth.uid()
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Academy managers can manage batch students"
    on batch_students for all
    using (
      is_admin()
      or exists (
        select 1 from batches b
        where b.id = batch_students.batch_id
          and can_manage_academy(b.academy_id)
      )
    );
exception when duplicate_object then null;
end $$;


-- Competition Foundation (V2 Core Domain)
-- Additive migration — does NOT modify or drop existing tables.
-- Run once in Supabase Dashboard → SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- Competitions
-- ---------------------------------------------------------------------------

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  organizer_id uuid references profiles(id) on delete set null,
  academy_id uuid references academies(id) on delete set null,
  venue text,
  city text,
  state text,
  country text not null default 'IN',
  start_date date,
  end_date date,
  registration_deadline timestamptz,
  entry_fee numeric(12, 2) not null default 0,
  format text not null default 'individual'
    check (format in ('individual', 'team', 'online')),
  scope text not null default 'friendly'
    check (scope in ('friendly', 'state', 'national', 'international')),
  status text not null default 'draft'
    check (status in (
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'scoring',
      'results_pending',
      'completed',
      'archived'
    )),
  max_participants integer check (max_participants is null or max_participants > 0),
  rules text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_slug_unique unique (slug),
  constraint competitions_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index if not exists idx_competitions_organizer on competitions(organizer_id);
create index if not exists idx_competitions_academy on competitions(academy_id);
create index if not exists idx_competitions_status on competitions(status);
create index if not exists idx_competitions_start_date on competitions(start_date);
create index if not exists idx_competitions_scope on competitions(scope);

-- ---------------------------------------------------------------------------
-- Competition events (stages / sessions within a competition)
-- ---------------------------------------------------------------------------

create table if not exists competition_events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  venue text,
  stage text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  sort_order integer not null default 0,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_events_competition on competition_events(competition_id);
create index if not exists idx_competition_events_starts_at on competition_events(competition_id, starts_at);

-- ---------------------------------------------------------------------------
-- Competition categories (age group + style)
-- ---------------------------------------------------------------------------

create table if not exists competition_categories (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  age_group text check (age_group is null or age_group in (
    'under_8', 'under_10', 'under_12', 'under_14', 'under_16', 'under_18', 'open', 'masters'
  )),
  style_type text check (style_type is null or style_type in (
    'traditional', 'artistic', 'rhythmic', 'pair', 'group'
  )),
  difficulty text check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')),
  max_participants integer check (max_participants is null or max_participants > 0),
  entry_fee_override numeric(12, 2),
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_categories_competition on competition_categories(competition_id);
create index if not exists idx_competition_categories_status on competition_categories(competition_id, status);

-- ---------------------------------------------------------------------------
-- Competition divisions (sub-groups within a category)
-- ---------------------------------------------------------------------------

create table if not exists competition_divisions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references competition_categories(id) on delete cascade,
  name text not null,
  code text,
  max_participants integer check (max_participants is null or max_participants > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_divisions_category on competition_divisions(category_id);

-- ---------------------------------------------------------------------------
-- Competition registrations
-- ---------------------------------------------------------------------------

create table if not exists competition_registrations (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  category_id uuid references competition_categories(id) on delete set null,
  division_id uuid references competition_divisions(id) on delete set null,
  registrant_id uuid not null references profiles(id) on delete cascade,
  registrant_type text not null default 'student'
    check (registrant_type in ('student', 'teacher', 'academy', 'organizer')),
  academy_id uuid references academies(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'partial', 'waived')),
  payment_amount numeric(12, 2),
  payment_reference text,
  notes text,
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_registrations_competition on competition_registrations(competition_id);
create index if not exists idx_competition_registrations_registrant on competition_registrations(registrant_id);
create index if not exists idx_competition_registrations_status on competition_registrations(competition_id, status);
create index if not exists idx_competition_registrations_academy on competition_registrations(academy_id)
  where academy_id is not null;

-- ---------------------------------------------------------------------------
-- Competition participants
-- ---------------------------------------------------------------------------

create table if not exists competition_participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references competition_registrations(id) on delete cascade,
  competition_id uuid not null references competitions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references competition_categories(id) on delete restrict,
  division_id uuid references competition_divisions(id) on delete set null,
  display_name text not null,
  date_of_birth date,
  gender text,
  academy_id uuid references academies(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  status text not null default 'registered'
    check (status in (
      'registered', 'checked_in', 'performing', 'completed', 'withdrawn', 'disqualified'
    )),
  check_in_at timestamptz,
  documents_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_participants_unique_student unique (competition_id, student_id, category_id)
);

create index if not exists idx_competition_participants_competition on competition_participants(competition_id);
create index if not exists idx_competition_participants_student on competition_participants(student_id);
create index if not exists idx_competition_participants_registration on competition_participants(registration_id);
create index if not exists idx_competition_participants_category on competition_participants(category_id);

-- ---------------------------------------------------------------------------
-- Competition judges
-- ---------------------------------------------------------------------------

create table if not exists competition_judges (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'judge'
    check (role in ('head_judge', 'judge', 'scorer', 'technical')),
  category_id uuid references competition_categories(id) on delete set null,
  event_id uuid references competition_events(id) on delete set null,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'inactive', 'removed')),
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_judges_unique unique (competition_id, user_id)
);

create index if not exists idx_competition_judges_competition on competition_judges(competition_id);
create index if not exists idx_competition_judges_user on competition_judges(user_id);

-- ---------------------------------------------------------------------------
-- Competition scores
-- ---------------------------------------------------------------------------

create table if not exists competition_scores (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid not null references competition_participants(id) on delete cascade,
  judge_id uuid not null references competition_judges(id) on delete cascade,
  category_id uuid references competition_categories(id) on delete set null,
  event_id uuid references competition_events(id) on delete set null,
  criteria jsonb not null default '{}'::jsonb,
  total_score numeric(8, 2) not null default 0,
  comments text,
  submitted_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_scores_unique unique (participant_id, judge_id, event_id)
);

create index if not exists idx_competition_scores_competition on competition_scores(competition_id);
create index if not exists idx_competition_scores_participant on competition_scores(participant_id);
create index if not exists idx_competition_scores_judge on competition_scores(judge_id);

-- ---------------------------------------------------------------------------
-- Competition results
-- ---------------------------------------------------------------------------

create table if not exists competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid not null references competition_participants(id) on delete cascade,
  category_id uuid not null references competition_categories(id) on delete restrict,
  division_id uuid references competition_divisions(id) on delete set null,
  rank integer check (rank is null or rank > 0),
  total_score numeric(8, 2),
  medal text check (medal is null or medal in ('gold', 'silver', 'bronze', 'participation')),
  status text not null default 'provisional'
    check (status in ('provisional', 'approved', 'published')),
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_results_unique_participant unique (participant_id)
);

create index if not exists idx_competition_results_competition on competition_results(competition_id);
create index if not exists idx_competition_results_category on competition_results(category_id, rank);

-- ---------------------------------------------------------------------------
-- Competition certificates (QR verification + digital signatures ready)
-- ---------------------------------------------------------------------------

create table if not exists competition_certificates (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid references competition_participants(id) on delete set null,
  result_id uuid references competition_results(id) on delete set null,
  certificate_type text not null default 'participation'
    check (certificate_type in ('participation', 'merit', 'winner', 'judge')),
  recipient_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  qr_code_token text not null,
  verification_url text,
  signature_data jsonb not null default '{}'::jsonb,
  pdf_url text,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_certificates_qr_unique unique (qr_code_token)
);

create index if not exists idx_competition_certificates_competition on competition_certificates(competition_id);
create index if not exists idx_competition_certificates_recipient on competition_certificates(recipient_id);
create index if not exists idx_competition_certificates_qr on competition_certificates(qr_code_token);

-- ---------------------------------------------------------------------------
-- Competition rankings (student / teacher / academy / state / national)
-- ---------------------------------------------------------------------------

create table if not exists competition_rankings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  scope text not null
    check (scope in ('student', 'teacher', 'academy', 'state', 'national', 'international')),
  subject_type text not null
    check (subject_type in ('student', 'teacher', 'academy')),
  subject_id uuid not null,
  category_id uuid references competition_categories(id) on delete set null,
  period_start date,
  period_end date,
  rank integer not null check (rank > 0),
  points numeric(12, 2) not null default 0,
  season text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_rankings_scope on competition_rankings(scope, rank);
create index if not exists idx_competition_rankings_subject on competition_rankings(subject_type, subject_id);
create index if not exists idx_competition_rankings_competition on competition_rankings(competition_id)
  where competition_id is not null;
create index if not exists idx_competition_rankings_season on competition_rankings(season, scope);

-- ---------------------------------------------------------------------------
-- Competition announcements
-- ---------------------------------------------------------------------------

create table if not exists competition_announcements (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all'
    check (audience in ('all', 'participants', 'judges', 'organizers', 'public')),
  published_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_announcements_competition on competition_announcements(competition_id);
create index if not exists idx_competition_announcements_published on competition_announcements(competition_id, status)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_competition_organizer(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competitions c
    where c.id = target_competition_id
      and (
        c.organizer_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
  or (
    exists (
      select 1
      from competitions c
      join academy_members am on am.academy_id = c.academy_id
      where c.id = target_competition_id
        and am.user_id = auth.uid()
        and am.status = 'active'
        and am.role in ('owner', 'manager')
    )
  );
$$;

create or replace function public.is_competition_judge(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competition_judges cj
    where cj.competition_id = target_competition_id
      and cj.user_id = auth.uid()
      and cj.status = 'active'
  );
$$;

create or replace function public.is_competition_participant(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competition_participants cp
    where cp.competition_id = target_competition_id
      and cp.student_id = auth.uid()
  )
  or exists (
    select 1
    from competition_registrations cr
    where cr.competition_id = target_competition_id
      and cr.registrant_id = auth.uid()
      and cr.status in ('pending', 'confirmed', 'waitlisted')
  );
$$;

create or replace function public.can_manage_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or is_competition_organizer(target_competition_id);
$$;

create or replace function public.can_view_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin()
    or is_competition_organizer(target_competition_id)
    or is_competition_judge(target_competition_id)
    or is_competition_participant(target_competition_id)
    or exists (
      select 1
      from competitions c
      where c.id = target_competition_id
        and c.status in (
          'published',
          'registration_open',
          'registration_closed',
          'in_progress',
          'scoring',
          'results_pending',
          'completed'
        )
    );
$$;

create or replace function public.can_register_for_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from competitions c
      where c.id = target_competition_id
        and c.status = 'registration_open'
        and (c.registration_deadline is null or c.registration_deadline > now())
    );
$$;

create or replace function public.can_score_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or is_competition_judge(target_competition_id);
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_competitions_updated_at on competitions;
create trigger trg_competitions_updated_at
  before update on competitions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_events_updated_at on competition_events;
create trigger trg_competition_events_updated_at
  before update on competition_events
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_categories_updated_at on competition_categories;
create trigger trg_competition_categories_updated_at
  before update on competition_categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_divisions_updated_at on competition_divisions;
create trigger trg_competition_divisions_updated_at
  before update on competition_divisions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_registrations_updated_at on competition_registrations;
create trigger trg_competition_registrations_updated_at
  before update on competition_registrations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_participants_updated_at on competition_participants;
create trigger trg_competition_participants_updated_at
  before update on competition_participants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_judges_updated_at on competition_judges;
create trigger trg_competition_judges_updated_at
  before update on competition_judges
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_scores_updated_at on competition_scores;
create trigger trg_competition_scores_updated_at
  before update on competition_scores
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_results_updated_at on competition_results;
create trigger trg_competition_results_updated_at
  before update on competition_results
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_certificates_updated_at on competition_certificates;
create trigger trg_competition_certificates_updated_at
  before update on competition_certificates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_rankings_updated_at on competition_rankings;
create trigger trg_competition_rankings_updated_at
  before update on competition_rankings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_announcements_updated_at on competition_announcements;
create trigger trg_competition_announcements_updated_at
  before update on competition_announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table competitions enable row level security;
alter table competition_events enable row level security;
alter table competition_categories enable row level security;
alter table competition_divisions enable row level security;
alter table competition_registrations enable row level security;
alter table competition_participants enable row level security;
alter table competition_judges enable row level security;
alter table competition_scores enable row level security;
alter table competition_results enable row level security;
alter table competition_certificates enable row level security;
alter table competition_rankings enable row level security;
alter table competition_announcements enable row level security;

-- Competitions
do $$ begin
  create policy "Public can view published competitions"
    on competitions for select
    using (can_view_competition(id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage competitions"
    on competitions for all
    using (can_manage_competition(id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can create competitions"
    on competitions for insert
    with check (auth.uid() is not null and created_by = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin manage competitions"
    on competitions for all
    using (is_admin());
exception when duplicate_object then null;
end $$;

-- Competition events
do $$ begin
  create policy "Competition viewers can read events"
    on competition_events for select
    using (can_view_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage events"
    on competition_events for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition categories
do $$ begin
  create policy "Competition viewers can read categories"
    on competition_categories for select
    using (can_view_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage categories"
    on competition_categories for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition divisions
do $$ begin
  create policy "Competition viewers can read divisions"
    on competition_divisions for select
    using (
      is_admin()
      or exists (
        select 1 from competition_categories cc
        where cc.id = competition_divisions.category_id
          and can_view_competition(cc.competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage divisions"
    on competition_divisions for all
    using (
      is_admin()
      or exists (
        select 1 from competition_categories cc
        where cc.id = competition_divisions.category_id
          and can_manage_competition(cc.competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition registrations
do $$ begin
  create policy "Registrants and organizers can view registrations"
    on competition_registrations for select
    using (
      is_admin()
      or registrant_id = auth.uid()
      or can_manage_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can submit registrations when open"
    on competition_registrations for insert
    with check (
      auth.uid() = registrant_id
      and can_register_for_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage registrations"
    on competition_registrations for update
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition participants
do $$ begin
  create policy "Participants and organizers can view participants"
    on competition_participants for select
    using (
      is_admin()
      or student_id = auth.uid()
      or can_manage_competition(competition_id)
      or is_competition_judge(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage participants"
    on competition_participants for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition judges
do $$ begin
  create policy "Judges and organizers can view judge roster"
    on competition_judges for select
    using (
      is_admin()
      or user_id = auth.uid()
      or can_manage_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage judges"
    on competition_judges for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition scores
do $$ begin
  create policy "Judges and organizers can view scores"
    on competition_scores for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Assigned judges can submit scores"
    on competition_scores for insert
    with check (
      is_admin()
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
          and cj.status = 'active'
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Assigned judges can update draft scores"
    on competition_scores for update
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
          and cj.status = 'active'
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition results
do $$ begin
  create policy "Published results are viewable"
    on competition_results for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or is_competition_judge(competition_id)
      or (
        status = 'published'
        and can_view_competition(competition_id)
      )
      or exists (
        select 1 from competition_participants cp
        where cp.id = competition_results.participant_id
          and cp.student_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage results"
    on competition_results for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition certificates
do $$ begin
  create policy "Recipients and organizers can view certificates"
    on competition_certificates for select
    using (
      is_admin()
      or recipient_id = auth.uid()
      or can_manage_competition(competition_id)
      or (status = 'issued' and qr_code_token is not null)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage certificates"
    on competition_certificates for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition rankings
do $$ begin
  create policy "Public can view rankings"
    on competition_rankings for select
    using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin and organizers can manage rankings"
    on competition_rankings for all
    using (
      is_admin()
      or (
        competition_id is not null
        and can_manage_competition(competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition announcements
do $$ begin
  create policy "Audience can view published announcements"
    on competition_announcements for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or (
        status = 'published'
        and can_view_competition(competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage announcements"
    on competition_announcements for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;


-- Yogstra V2 — Migration 007: realtime publications, storage buckets, admin seeds
-- Consolidates: live-sync.sql, teacher-realtime.sql, messages-realtime.sql,
--               avatars-storage.sql, schema.sql storage, security-hardening storage,
--               setup-admin.sql (optional seed commented)

-- ---------------------------------------------------------------------------
-- Realtime publications (ignore if publication unavailable)
-- ---------------------------------------------------------------------------

do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.bookings; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.schedules; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payouts; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.teacher_profiles; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.direct_messages; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.chat_threads; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.chat_thread_reads; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.chat_thread_settings; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.chat_reports; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.class_orders; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.platform_settings; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.teacher_notifications; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.schedule_change_requests; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.class_sessions; exception when duplicate_object then null; when undefined_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Post media — public read, uid-scoped write
drop policy if exists "Post media is publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload post media" on storage.objects;
drop policy if exists "Users upload own post media" on storage.objects;
drop policy if exists "Users update own post media" on storage.objects;
drop policy if exists "Users delete own post media" on storage.objects;

create policy "Post media public read"
  on storage.objects for select using (bucket_id = 'post-media');

create policy "Users upload own post media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own post media"
  on storage.objects for update to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own post media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Optional admin seed (uncomment and set email after auth user exists)
-- ---------------------------------------------------------------------------
-- insert into public.profiles (id, role, full_name)
-- select id, 'admin', coalesce(raw_user_meta_data->>'full_name', email)
-- from auth.users where email = 'admin@example.com'
-- on conflict (id) do update set role = 'admin';


-- Bug fix: email lookup for academy member invites (profiles has no email column; email lives in auth.users)

create or replace function public.find_profile_id_by_email(lookup_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(lookup_email))
  limit 1;
$$;

grant execute on function public.find_profile_id_by_email(text) to authenticated;



create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
