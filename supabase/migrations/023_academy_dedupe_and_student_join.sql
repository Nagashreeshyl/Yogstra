-- Fix duplicate Yogshala academy, link owner teachers to teacher_academies,
-- and broaden student academy discovery to include academy member coaches.

-- Merge duplicate academy created during failed bootstrap retries.
update batches
set academy_id = '12b79495-0050-464a-948a-9b00e9b4c80b'
where academy_id = 'be835307-0bac-4cf4-9877-070555f19ecc';

delete from academy_members
where academy_id = 'be835307-0bac-4cf4-9877-070555f19ecc';

delete from academy_settings
where academy_id = 'be835307-0bac-4cf4-9877-070555f19ecc';

update academies
set status = 'archived', updated_at = now()
where id = 'be835307-0bac-4cf4-9877-070555f19ecc';

-- Ensure academy owner teachers appear in teacher_academies for student joins.
insert into teacher_academies (academy_id, teacher_id, employment_type, is_primary, status, started_at)
select
  am.academy_id,
  am.user_id,
  'employed',
  true,
  'active',
  coalesce(am.joined_at, now())
from academy_members am
join profiles p on p.id = am.user_id and p.role = 'teacher'
where am.role = 'owner'
  and am.status = 'active'
  and not exists (
    select 1
    from teacher_academies ta
    where ta.academy_id = am.academy_id
      and ta.teacher_id = am.user_id
  );

create or replace function public.list_student_coach_academies()
returns table (
  academy_id uuid,
  academy_name text,
  academy_city text,
  academy_state text,
  coach_id uuid,
  coach_name text,
  is_enrolled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    a.id,
    a.name,
    a.city,
    a.state,
    p.id,
    coalesce(p.full_name, 'Coach'),
    exists (
      select 1
      from batch_students bs
      join batches b on b.id = bs.batch_id
      where bs.student_id = auth.uid()
        and b.academy_id = a.id
        and bs.status = 'active'
    )
  from bookings bk
  join profiles p on p.id = bk.teacher_id
  join academies a on a.status = 'active'
  where bk.student_id = auth.uid()
    and bk.status = 'active'
    and (
      exists (
        select 1
        from teacher_academies ta
        where ta.teacher_id = bk.teacher_id
          and ta.academy_id = a.id
          and ta.status = 'active'
      )
      or exists (
        select 1
        from academy_members am
        where am.user_id = bk.teacher_id
          and am.academy_id = a.id
          and am.status = 'active'
          and am.role in ('owner', 'manager', 'teacher', 'assistant_teacher')
      )
    );
$$;

create or replace function public.list_student_joinable_batches(p_academy_id uuid)
returns table (
  id uuid,
  name text,
  difficulty text,
  capacity integer
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.name, b.difficulty, b.capacity
  from batches b
  where b.academy_id = p_academy_id
    and b.status = 'active'
    and exists (
      select 1
      from bookings bk
      where bk.student_id = auth.uid()
        and bk.status = 'active'
        and (
          exists (
            select 1
            from teacher_academies ta
            where ta.teacher_id = bk.teacher_id
              and ta.academy_id = p_academy_id
              and ta.status = 'active'
          )
          or exists (
            select 1
            from academy_members am
            where am.user_id = bk.teacher_id
              and am.academy_id = p_academy_id
              and am.status = 'active'
              and am.role in ('owner', 'manager', 'teacher', 'assistant_teacher')
          )
        )
    )
  order by b.name;
$$;

create or replace function public.join_student_academy_batch(p_batch_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_academy_id uuid;
  v_batch_status text;
  v_enrollment_id uuid;
begin
  if v_student_id is null then
    raise exception 'Sign in to join an academy.';
  end if;

  select b.academy_id, b.status
  into v_academy_id, v_batch_status
  from batches b
  where b.id = p_batch_id;

  if v_academy_id is null then
    raise exception 'Batch not found.';
  end if;

  if v_batch_status <> 'active' then
    raise exception 'This batch is not open for enrollment.';
  end if;

  if not exists (
    select 1
    from bookings bk
    where bk.student_id = v_student_id
      and bk.status = 'active'
      and (
        exists (
          select 1
          from teacher_academies ta
          where ta.teacher_id = bk.teacher_id
            and ta.academy_id = v_academy_id
            and ta.status = 'active'
        )
        or exists (
          select 1
          from academy_members am
          where am.user_id = bk.teacher_id
            and am.academy_id = v_academy_id
            and am.status = 'active'
            and am.role in ('owner', 'manager', 'teacher', 'assistant_teacher')
        )
      )
  ) then
    raise exception 'You need an active coaching relationship with a teacher at this academy.';
  end if;

  if exists (
    select 1
    from batch_students bs
    join batches b on b.id = bs.batch_id
    where bs.student_id = v_student_id
      and b.academy_id = v_academy_id
      and bs.status = 'active'
  ) then
    raise exception 'You are already enrolled in this academy.';
  end if;

  insert into batch_students (batch_id, student_id, enrollment_type, status)
  values (p_batch_id, v_student_id, 'academy', 'active')
  on conflict (batch_id, student_id) do update
    set status = 'active',
        enrollment_type = excluded.enrollment_type,
        enrolled_at = now()
  returning batch_students.id into v_enrollment_id;

  return v_enrollment_id;
end;
$$;
