-- Fix: direct_video_calls was created without room_name (required by LiveKit DM calls)
-- Idempotent — safe to re-run.

alter table public.direct_video_calls
  add column if not exists room_name text;

update public.direct_video_calls
set room_name = 'yogstra-dm-' || id::text
where room_name is null;

alter table public.direct_video_calls
  alter column room_name set not null;

create unique index if not exists direct_video_calls_room_name_idx
  on public.direct_video_calls (room_name);
