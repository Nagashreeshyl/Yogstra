-- Yogstra Supabase schema
-- Run in Supabase Dashboard → SQL Editor

-- Categories
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

-- Profiles (both students and teachers)
create table if not exists profiles (
  id uuid references auth.users primary key,
  role text check (role in ('student', 'teacher', 'admin')),
  full_name text,
  phone text,
  city text,
  state text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Teacher details
create table if not exists teacher_profiles (
  id uuid references profiles primary key,
  bio text,
  experience_years text,
  monthly_fee numeric,
  certifications text,
  rating numeric default 0,
  total_students integer default 0,
  status text default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  specializations text[]
);

-- Bookings
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles,
  teacher_id uuid references profiles,
  status text default 'active',
  payment_status text default 'pending',
  monthly_fee numeric,
  start_date date default current_date,
  created_at timestamptz default now()
);

-- Schedules
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles,
  student_id uuid references profiles,
  class_type text check (class_type in ('1:1', 'group')),
  scheduled_at timestamptz,
  duration_minutes integer default 60,
  created_at timestamptz default now()
);

-- Community posts
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles,
  content text,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  likes integer default 0,
  created_at timestamptz default now()
);

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts,
  author_id uuid references profiles,
  content text,
  created_at timestamptz default now()
);

-- Chats
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings,
  sender_id uuid references profiles,
  content text,
  created_at timestamptz default now()
);

-- Payouts
create table if not exists payouts (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles,
  amount numeric,
  period text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table teacher_profiles enable row level security;
alter table bookings enable row level security;
alter table schedules enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table payouts enable row level security;
alter table categories enable row level security;

-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Basic RLS policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admin can manage profiles"
  on profiles for all using (is_admin());

create policy "Teacher profiles viewable by everyone"
  on teacher_profiles for select using (true);

create policy "Teachers can insert own teacher profile"
  on teacher_profiles for insert with check (auth.uid() = id);

create policy "Teachers can update own teacher profile"
  on teacher_profiles for update using (auth.uid() = id);

create policy "Admin can manage teacher profiles"
  on teacher_profiles for all using (is_admin());

create policy "Posts viewable by everyone"
  on posts for select using (true);

create policy "Authenticated users can post"
  on posts for insert with check (auth.uid() = author_id);

create policy "Admin can delete posts"
  on posts for delete using (is_admin());

create policy "Comments viewable by everyone"
  on comments for select using (true);

create policy "Authenticated users can comment"
  on comments for insert with check (auth.uid() = author_id);

create policy "Categories viewable by everyone"
  on categories for select using (true);

create policy "Admin can manage categories"
  on categories for all using (is_admin());

create policy "Users can view own bookings"
  on bookings for select
  using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin());

create policy "Admin can manage bookings"
  on bookings for all using (is_admin());

create policy "Users can view relevant schedules"
  on schedules for select
  using (auth.uid() = teacher_id or auth.uid() = student_id or is_admin());

create policy "Teachers can manage own schedules"
  on schedules for insert with check (auth.uid() = teacher_id);

create policy "Admin can manage schedules"
  on schedules for all using (is_admin());

create policy "Users can view own messages"
  on messages for select
  using (
    auth.uid() = sender_id or
    is_admin() or
    auth.uid() in (
      select student_id from bookings where id = booking_id
      union
      select teacher_id from bookings where id = booking_id
    )
  );

create policy "Users can send messages"
  on messages for insert with check (auth.uid() = sender_id);

create policy "Admin can view all payouts"
  on payouts for select using (is_admin() or auth.uid() = teacher_id);

create policy "Admin can manage payouts"
  on payouts for update using (is_admin());

-- Storage for post media
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "Post media is publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "Authenticated users can upload post media"
  on storage.objects for insert
  with check (bucket_id = 'post-media' and auth.role() = 'authenticated');

-- Seed default categories (run once after creating tables)
insert into categories (name, icon)
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
where not exists (select 1 from categories limit 1);
