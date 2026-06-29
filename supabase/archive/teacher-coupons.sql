-- Teacher coupon codes + delivery to students
-- Run in Supabase Dashboard → SQL Editor (after schema.sql + setup-messaging.sql)

create table if not exists teacher_coupons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  code text not null unique,
  class_type text not null check (class_type in ('1:1', 'group')),
  duration text not null check (duration in ('week', 'month')),
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists teacher_coupons_teacher_id_idx on teacher_coupons(teacher_id, created_at desc);
create index if not exists teacher_coupons_code_idx on teacher_coupons(code);

create table if not exists coupon_deliveries (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references teacher_coupons(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  used_at timestamptz,
  order_id uuid references class_orders(id) on delete set null,
  unique (coupon_id, student_id)
);

create index if not exists coupon_deliveries_student_id_idx on coupon_deliveries(student_id);

alter table class_orders
  add column if not exists coupon_id uuid references teacher_coupons(id) on delete set null,
  add column if not exists discount_percent numeric;

-- Helpers use SECURITY DEFINER so RLS policies do not cross-reference each other (avoids infinite recursion)
create or replace function public.user_owns_teacher_coupon(p_coupon_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from teacher_coupons
    where id = p_coupon_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.student_received_coupon(p_coupon_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from coupon_deliveries
    where coupon_id = p_coupon_id and student_id = auth.uid()
  );
$$;

grant execute on function public.user_owns_teacher_coupon(uuid) to authenticated;
grant execute on function public.student_received_coupon(uuid) to authenticated;

alter table teacher_coupons enable row level security;
alter table coupon_deliveries enable row level security;

drop policy if exists "Teachers manage own coupons" on teacher_coupons;
drop policy if exists "Students read coupons sent to them" on teacher_coupons;
drop policy if exists "Admin read coupons" on teacher_coupons;
drop policy if exists "Teachers manage coupon deliveries" on coupon_deliveries;
drop policy if exists "Students read own coupon deliveries" on coupon_deliveries;
drop policy if exists "Students mark own coupon used" on coupon_deliveries;

create policy "Teachers manage own coupons"
  on teacher_coupons for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Students read coupons sent to them"
  on teacher_coupons for select
  using (public.student_received_coupon(id) or is_admin());

create policy "Admin read coupons"
  on teacher_coupons for select
  using (is_admin());

create policy "Teachers manage coupon deliveries"
  on coupon_deliveries for all
  using (public.user_owns_teacher_coupon(coupon_id))
  with check (public.user_owns_teacher_coupon(coupon_id));

create policy "Students read own coupon deliveries"
  on coupon_deliveries for select
  using (auth.uid() = student_id or is_admin());

create policy "Students mark own coupon used"
  on coupon_deliveries for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
