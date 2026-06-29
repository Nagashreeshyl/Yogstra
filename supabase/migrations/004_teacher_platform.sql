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
