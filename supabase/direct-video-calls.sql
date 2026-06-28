-- WhatsApp-style 1-on-1 video calls from Messages (LiveKit)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists direct_video_calls (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  caller_id uuid not null references profiles(id) on delete cascade,
  callee_id uuid not null references profiles(id) on delete cascade,
  room_name text not null unique,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists direct_video_calls_caller_id_idx on direct_video_calls(caller_id, created_at desc);
create index if not exists direct_video_calls_callee_id_idx on direct_video_calls(callee_id, created_at desc);
create index if not exists direct_video_calls_thread_id_idx on direct_video_calls(thread_id, created_at desc);
create index if not exists direct_video_calls_status_idx on direct_video_calls(status);

alter table direct_video_calls enable row level security;

do $$ begin
  create policy "Participants view own video calls"
    on direct_video_calls for select
    using (auth.uid() = caller_id or auth.uid() = callee_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Callers create on accepted threads"
    on direct_video_calls for insert
    with check (
      auth.uid() = caller_id
      and exists (
        select 1 from chat_threads t
        where t.id = thread_id
          and t.status = 'accepted'
          and auth.uid() in (t.participant_a, t.participant_b)
          and caller_id in (t.participant_a, t.participant_b)
          and callee_id in (t.participant_a, t.participant_b)
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Participants update own video calls"
    on direct_video_calls for update
    using (auth.uid() = caller_id or auth.uid() = callee_id)
    with check (auth.uid() = caller_id or auth.uid() = callee_id);
exception when duplicate_object then null;
end $$;

alter table direct_video_calls replica identity full;

do $$ begin
  alter publication supabase_realtime add table direct_video_calls;
exception when duplicate_object then null; when undefined_object then null; end $$;
