-- Yogstra V2 — Migration 000: extensions and shared helpers
-- Idempotent. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Shared timestamp helper (used by academy, competition, and core patches)
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

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Auth signup trigger — creates profile (+ teacher_profiles when role=teacher)
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
