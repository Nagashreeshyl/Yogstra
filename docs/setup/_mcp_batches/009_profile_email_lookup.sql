-- Bug fix: email lookup for academy member invites (profiles has no email column; email lives in auth.users)

create or replace function public.find_profile_id_by_email(lookup_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(lookup_email))
  limit 1;
$$;

grant execute on function public.find_profile_id_by_email(text) to authenticated;
