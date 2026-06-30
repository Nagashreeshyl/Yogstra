-- Allow students to apply teacher coupon codes shared via copy/paste (not only chat delivery).
-- Bypasses RLS safely: validates code + teacher + class/duration, then creates delivery row.

create or replace function public.validate_and_claim_coupon(
  p_code text,
  p_teacher_id uuid,
  p_class_type text,
  p_duration text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_coupon public.teacher_coupons%rowtype;
  v_delivery_id uuid;
  v_used_at timestamptz;
begin
  if v_student_id is null then
    raise exception 'You must be signed in to apply a coupon.';
  end if;

  select * into v_coupon
  from public.teacher_coupons
  where upper(trim(code)) = upper(trim(p_code))
    and teacher_id = p_teacher_id
    and is_active = true;

  if not found then
    raise exception 'Invalid or expired coupon code.';
  end if;

  if v_coupon.valid_until is not null and v_coupon.valid_until <= now() then
    update public.teacher_coupons set is_active = false where id = v_coupon.id;
    raise exception 'This coupon has expired.';
  end if;

  if v_coupon.max_uses is not null and v_coupon.use_count >= v_coupon.max_uses then
    update public.teacher_coupons set is_active = false where id = v_coupon.id;
    raise exception 'This coupon has reached its redemption limit.';
  end if;

  if v_coupon.class_type is distinct from p_class_type then
    if v_coupon.class_type = '1:1' then
      raise exception 'This coupon is for 1-on-1 classes only.';
    else
      raise exception 'This coupon is for Group (1-to-many) classes only.';
    end if;
  end if;

  if v_coupon.duration is distinct from p_duration then
    if v_coupon.duration = 'week' then
      raise exception 'This coupon is for 1 week bookings only.';
    else
      raise exception 'This coupon is for 1 month bookings only.';
    end if;
  end if;

  insert into public.coupon_deliveries (coupon_id, student_id)
  values (v_coupon.id, v_student_id)
  on conflict (coupon_id, student_id) do nothing;

  select id, used_at into v_delivery_id, v_used_at
  from public.coupon_deliveries
  where coupon_id = v_coupon.id
    and student_id = v_student_id;

  if v_delivery_id is null then
    raise exception 'Could not claim coupon. Try again.';
  end if;

  if v_used_at is not null then
    raise exception 'This coupon has already been used.';
  end if;

  return jsonb_build_object(
    'coupon_id', v_coupon.id,
    'delivery_id', v_delivery_id,
    'code', v_coupon.code,
    'class_type', v_coupon.class_type,
    'duration', v_coupon.duration,
    'discount_percent', v_coupon.discount_percent,
    'teacher_id', v_coupon.teacher_id,
    'is_active', v_coupon.is_active,
    'valid_until', v_coupon.valid_until,
    'max_uses', v_coupon.max_uses,
    'use_count', v_coupon.use_count,
    'created_at', v_coupon.created_at
  );
end;
$$;

revoke all on function public.validate_and_claim_coupon(text, uuid, text, text) from public;
grant execute on function public.validate_and_claim_coupon(text, uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
