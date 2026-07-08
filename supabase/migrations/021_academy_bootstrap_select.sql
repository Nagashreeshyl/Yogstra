-- Fix academy bootstrap: INSERT ... RETURNING on academy_members / academy_settings
-- failed SELECT RLS (can_view_academy before membership row is visible).
-- Also repair academies left orphaned by prior failed bootstraps.

do $$ begin
  create policy "Users can view own academy membership"
    on academy_members for select
    using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Creators can view own academy settings"
    on academy_settings for select
    using (
      exists (
        select 1
        from academies a
        where a.id = academy_settings.academy_id
          and a.created_by = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

insert into academy_members (academy_id, user_id, role, status, joined_at)
select a.id, a.created_by, 'owner', 'active', now()
from academies a
where a.created_by is not null
  and not exists (
    select 1
    from academy_members am
    where am.academy_id = a.id
      and am.user_id = a.created_by
      and am.role = 'owner'
  );

insert into academy_settings (academy_id)
select a.id
from academies a
where not exists (
  select 1 from academy_settings s where s.academy_id = a.id
);
