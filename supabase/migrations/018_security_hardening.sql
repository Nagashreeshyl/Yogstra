-- Sprint 18 — Security hardening (verified privilege escalation & payment bypass fixes)
-- Replaces unsafe signup metadata trust, profile role updates, teacher self-verification,
-- client-side payment_status manipulation on orders/bookings/registrations.

-- ---------------------------------------------------------------------------
-- 1. Signup: never trust client metadata for admin (or invalid roles)
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
  if user_role not in ('student', 'teacher') then
    user_role := 'student';
  end if;

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

-- ---------------------------------------------------------------------------
-- 2. Profiles: block role escalation on insert/update (non-admin)
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_privileged_fields()
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
    if new.role is null or new.role not in ('student', 'teacher') then
      new.role := 'student';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_fields on public.profiles;
create trigger trg_protect_profile_privileged_fields
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role in ('student', 'teacher')
  );

-- ---------------------------------------------------------------------------
-- 3. Teacher profiles: block self-verification & status tampering
-- ---------------------------------------------------------------------------

create or replace function public.protect_teacher_profile_privileged_fields()
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
    new.status := 'pending';
    return new;
  end if;

  if new.status is distinct from old.status then
    new.status := old.status;
  end if;

  if new.rating is distinct from old.rating then
    new.rating := old.rating;
  end if;

  if new.total_students is distinct from old.total_students then
    new.total_students := old.total_students;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_teacher_profile_privileged_fields on public.teacher_profiles;
create trigger trg_protect_teacher_profile_privileged_fields
  before insert or update on public.teacher_profiles
  for each row execute function public.protect_teacher_profile_privileged_fields();

drop policy if exists "Teachers can insert own teacher profile" on public.teacher_profiles;
create policy "Teachers can insert own teacher profile"
  on public.teacher_profiles for insert
  with check (auth.uid() = id and status = 'pending');

-- ---------------------------------------------------------------------------
-- 4. Class orders & bookings: block client-side payment_status = paid
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

  if tg_op = 'UPDATE' then
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
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_class_order_payment_fields on public.class_orders;
create trigger trg_protect_class_order_payment_fields
  before update on public.class_orders
  for each row execute function public.protect_class_order_payment_fields();

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

  if tg_op = 'UPDATE' then
    if new.payment_status is distinct from old.payment_status then
      raise exception 'Booking payment status can only be updated by the payment server';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_booking_payment_fields on public.bookings;
create trigger trg_protect_booking_payment_fields
  before update on public.bookings
  for each row execute function public.protect_booking_payment_fields();

-- ---------------------------------------------------------------------------
-- 5. Competition registrations: registrants cannot self-mark paid/confirmed
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

  if new.registrant_id = auth.uid() then
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
  before update on public.competition_registrations
  for each row execute function public.protect_competition_registration_privileged_fields();

-- ---------------------------------------------------------------------------
-- 6. Public profile reads: add participant-scoped access (phone still in row;
--    app must not expose phone on public pages — see SECURITY_AUDIT_REPORT.md)
-- ---------------------------------------------------------------------------

drop policy if exists "Chat participants read counterpart profiles" on public.profiles;
create policy "Chat participants read counterpart profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.chat_threads t
      where t.status = 'accepted'
        and (
          (t.participant_a = auth.uid() and t.participant_b = profiles.id)
          or (t.participant_b = auth.uid() and t.participant_a = profiles.id)
        )
    )
  );

drop policy if exists "Booking participants read counterpart profiles" on public.profiles;
create policy "Booking participants read counterpart profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.bookings b
      where (b.student_id = auth.uid() and b.teacher_id = profiles.id)
         or (b.teacher_id = auth.uid() and b.student_id = profiles.id)
    )
  );

notify pgrst, 'reload schema';
