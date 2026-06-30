-- Sprint 18 follow-up — block INSERT-time payment bypass (verified via policy audit)
-- Service role inserts (auth.uid() IS NULL) remain unrestricted.

-- ---------------------------------------------------------------------------
-- 1. Class orders: clients may only INSERT pending orders
-- ---------------------------------------------------------------------------

create or replace function public.protect_class_order_payment_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.payment_status := 'pending';
    new.razorpay_order_id := null;
    new.razorpay_payment_id := null;
    new.transfer_status := coalesce(new.transfer_status, 'pending');
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status then
    raise exception 'Payment status can only be updated by the payment server';
  end if;
  if new.razorpay_order_id is distinct from old.razorpay_order_id
     and old.razorpay_order_id is not null then
    raise exception 'Payment order id cannot be changed';
  end if;
  if new.razorpay_payment_id is distinct from old.razorpay_payment_id then
    raise exception 'Payment id can only be set by the payment server';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_class_order_payment_fields on public.class_orders;
create trigger trg_protect_class_order_payment_fields
  before insert or update on public.class_orders
  for each row execute function public.protect_class_order_payment_fields();

drop policy if exists "Students can create class orders" on public.class_orders;
create policy "Students can create class orders"
  on public.class_orders for insert
  with check (
    auth.uid() = student_id
    and payment_status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- 2. Bookings: clients may only INSERT pending/unpaid bookings
-- ---------------------------------------------------------------------------

create or replace function public.protect_booking_payment_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.payment_status := coalesce(nullif(new.payment_status, 'paid'), 'pending');
    if new.payment_status = 'paid' then
      new.payment_status := 'pending';
    end if;
    if new.status = 'active' and new.payment_status <> 'paid' then
      new.status := 'pending';
    end if;
    return new;
  end if;

  if new.payment_status is distinct from old.payment_status then
    raise exception 'Booking payment status can only be updated by the payment server';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_booking_payment_fields on public.bookings;
create trigger trg_protect_booking_payment_fields
  before insert or update on public.bookings
  for each row execute function public.protect_booking_payment_fields();

drop policy if exists "Students can create paid bookings" on public.bookings;
create policy "Students can create pending bookings"
  on public.bookings for insert
  with check (
    auth.uid() = student_id
    and status = 'pending'
    and payment_status = 'pending'
  );

drop policy if exists "Students can activate own bookings after payment" on public.bookings;

-- ---------------------------------------------------------------------------
-- 3. Competition registrations: registrants INSERT unpaid/pending only
-- ---------------------------------------------------------------------------

create or replace function public.protect_competition_registration_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() or public.can_manage_competition(new.competition_id) then
    return new;
  end if;

  if tg_op = 'INSERT' and new.registrant_id = auth.uid() then
    new.payment_status := coalesce(nullif(new.payment_status, 'paid'), 'unpaid');
    if new.payment_status in ('paid', 'waived') then
      new.payment_status := 'unpaid';
    end if;
    if new.status in ('confirmed', 'approved') then
      new.status := 'pending';
    end if;
    new.confirmed_at := null;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.registrant_id = auth.uid() then
    if new.payment_status is distinct from old.payment_status then
      raise exception 'Payment status can only be updated by competition organizers';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Registration status can only be updated by competition organizers';
    end if;
    if new.confirmed_at is distinct from old.confirmed_at then
      new.confirmed_at := old.confirmed_at;
    end if;
    if new.payment_amount is distinct from old.payment_amount then
      new.payment_amount := old.payment_amount;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_competition_registration_privileged_fields on public.competition_registrations;
create trigger trg_protect_competition_registration_privileged_fields
  before insert or update on public.competition_registrations
  for each row execute function public.protect_competition_registration_privileged_fields();

notify pgrst, 'reload schema';
