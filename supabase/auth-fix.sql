-- Run this in Supabase SQL Editor to fix signup/login profile issues.
-- Safe to re-run.

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who signed up before the trigger existed
insert into public.profiles (id, role, full_name, phone, city, state)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'role', 'student'),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  coalesce(u.raw_user_meta_data->>'city', ''),
  coalesce(u.raw_user_meta_data->>'state', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

insert into public.teacher_profiles (
  id, bio, experience_years, monthly_fee, certifications, specializations, status
)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'bio', ''),
  coalesce(u.raw_user_meta_data->>'experience_years', ''),
  coalesce((u.raw_user_meta_data->>'monthly_fee')::numeric, 0),
  coalesce(u.raw_user_meta_data->>'certifications', ''),
  coalesce(
    case
      when jsonb_typeof(u.raw_user_meta_data->'specializations') = 'array' then
        array(select jsonb_array_elements_text(u.raw_user_meta_data->'specializations'))
      else '{}'::text[]
    end,
    '{}'::text[]
  ),
  'pending'
from auth.users u
join public.profiles p on p.id = u.id and p.role = 'teacher'
left join public.teacher_profiles tp on tp.id = u.id
where tp.id is null
on conflict (id) do nothing;

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can upsert own profile" on profiles;
create policy "Users can upsert own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Teachers can insert own teacher profile" on teacher_profiles;
create policy "Teachers can insert own teacher profile"
  on teacher_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Teachers can upsert own teacher profile" on teacher_profiles;
create policy "Teachers can upsert own teacher profile"
  on teacher_profiles for update
  using (auth.uid() = id);
