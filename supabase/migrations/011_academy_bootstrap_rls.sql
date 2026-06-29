-- Fix academy creation bootstrap: allow creators to insert owner membership
-- and default settings before can_manage_academy() would apply.

do $$ begin
  create policy "Creators bootstrap owner membership"
    on academy_members for insert
    with check (
      user_id = auth.uid()
      and role = 'owner'
      and exists (
        select 1
        from academies a
        where a.id = academy_id
          and a.created_by = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Creators bootstrap academy settings"
    on academy_settings for insert
    with check (
      exists (
        select 1
        from academies a
        where a.id = academy_id
          and a.created_by = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;
