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
