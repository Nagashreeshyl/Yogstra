-- Coupon expiry + global redemption limits
-- Run in Supabase Dashboard → SQL Editor (after teacher-coupons.sql)

alter table teacher_coupons
  add column if not exists valid_until timestamptz,
  add column if not exists max_uses integer check (max_uses is null or max_uses > 0),
  add column if not exists use_count integer not null default 0 check (use_count >= 0);

create index if not exists teacher_coupons_valid_until_idx
  on teacher_coupons(valid_until)
  where valid_until is not null and is_active = true;

-- Atomically mark a delivery used, bump global use_count, deactivate when limits hit
create or replace function public.redeem_coupon(p_delivery_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id uuid;
  v_use_count int;
  v_max_uses int;
  v_valid_until timestamptz;
begin
  update coupon_deliveries
  set used_at = now(), order_id = p_order_id
  where id = p_delivery_id
    and student_id = auth.uid()
    and used_at is null
  returning coupon_id into v_coupon_id;

  if v_coupon_id is null then
    raise exception 'Coupon already used or not found';
  end if;

  update teacher_coupons
  set use_count = use_count + 1
  where id = v_coupon_id
  returning use_count, max_uses, valid_until into v_use_count, v_max_uses, v_valid_until;

  if (v_max_uses is not null and v_use_count >= v_max_uses)
     or (v_valid_until is not null and v_valid_until <= now()) then
    update teacher_coupons set is_active = false where id = v_coupon_id;
  end if;
end;
$$;

grant execute on function public.redeem_coupon(uuid, uuid) to authenticated;
