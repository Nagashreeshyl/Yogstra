-- Creators can see academies they created even when inactive/archived (recovery after failed bootstrap).
-- Also exposes slug availability check across all statuses to prevent 409 on duplicate slugs.

do $$ begin
  create policy "Creators can view own academies"
    on academies for select
    using (created_by = auth.uid());
exception when duplicate_object then null;
end $$;

create or replace function public.academy_slug_taken(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academies
    where slug = p_slug
  );
$$;

grant execute on function public.academy_slug_taken(text) to authenticated;
