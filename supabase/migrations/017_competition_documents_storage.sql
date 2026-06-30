-- Competition registration document uploads (private bucket, student-owned paths)
insert into storage.buckets (id, name, public)
values ('competition-documents', 'competition-documents', false)
on conflict (id) do nothing;

drop policy if exists "Competition docs public read" on storage.objects;
drop policy if exists "Students read own competition docs" on storage.objects;
drop policy if exists "Organizers read competition participant docs" on storage.objects;
drop policy if exists "Students upload own competition docs" on storage.objects;
drop policy if exists "Students update own competition docs" on storage.objects;
drop policy if exists "Students delete own competition docs" on storage.objects;

create policy "Students read own competition docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'competition-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Organizers read competition participant docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'competition-documents'
    and exists (
      select 1
      from competitions c
      where c.organizer_id = auth.uid()
        and (storage.foldername(name))[2] = c.id::text
    )
  );

create policy "Students upload own competition docs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'competition-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Students update own competition docs"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'competition-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'competition-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Students delete own competition docs"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'competition-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
