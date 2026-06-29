-- Fix: infinite recursion detected in policy for relation "teacher_coupons"
-- Run this if you already applied an older version of teacher-coupons.sql

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

drop policy if exists "Students read coupons sent to them" on teacher_coupons;
drop policy if exists "Teachers manage coupon deliveries" on coupon_deliveries;

create policy "Students read coupons sent to them"
  on teacher_coupons for select
  using (public.student_received_coupon(id) or is_admin());

create policy "Teachers manage coupon deliveries"
  on coupon_deliveries for all
  using (public.user_owns_teacher_coupon(coupon_id))
  with check (public.user_owns_teacher_coupon(coupon_id));
