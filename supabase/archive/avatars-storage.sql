-- Avatars storage bucket + RLS policies
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop any existing avatars policies (safe to re-run)
drop policy if exists "Anyone can view avatars" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can upload to avatars" on storage.objects;
drop policy if exists "Authenticated users can upload to avatars" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;
drop policy if exists "Users can update avatars" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- Public read
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder: {user_id}/avatar.jpg
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Required for upsert when file already exists
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Required when removing before re-upload
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
