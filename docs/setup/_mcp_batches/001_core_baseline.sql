-- Temporary stub so RLS policies can reference is_admin before profiles exists
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
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


create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
