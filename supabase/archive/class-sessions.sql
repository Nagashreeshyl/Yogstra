-- Live video class sessions (LiveKit)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  schedule_id uuid references schedules(id) on delete set null,
  room_name text not null unique,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists class_sessions_teacher_id_idx on class_sessions(teacher_id, created_at desc);
create index if not exists class_sessions_student_id_idx on class_sessions(student_id, created_at desc);
create index if not exists class_sessions_status_idx on class_sessions(status);

alter table class_sessions enable row level security;

do $$ begin
  create policy "Teachers manage own class sessions"
    on class_sessions for all
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Students view and respond to own sessions"
    on class_sessions for select
    using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Students update own ringing sessions"
    on class_sessions for update
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table class_sessions;
exception when duplicate_object then null; when undefined_object then null; end $$;
