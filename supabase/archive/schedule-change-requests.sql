-- Student schedule change requests (1–3 day or permanent until plan ends)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists schedule_change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  class_order_id uuid references class_orders(id) on delete set null,
  schedule_id uuid references schedules(id) on delete set null,
  scope text not null check (scope in ('1_day', '2_days', '3_days', 'permanent')),
  current_scheduled_at timestamptz not null,
  requested_date date not null,
  requested_time text not null,
  student_note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  teacher_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists schedule_change_requests_teacher_idx
  on schedule_change_requests(teacher_id, status, created_at desc);
create index if not exists schedule_change_requests_student_idx
  on schedule_change_requests(student_id, status, created_at desc);

alter table schedule_change_requests enable row level security;

do $$ begin
  create policy "Students manage own schedule change requests"
    on schedule_change_requests for all
    using (auth.uid() = student_id)
    with check (auth.uid() = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers view and resolve schedule change requests"
    on schedule_change_requests for select
    using (auth.uid() = teacher_id or auth.uid() = student_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers update schedule change requests"
    on schedule_change_requests for update
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers update own schedules"
    on schedules for update
    using (auth.uid() = teacher_id or is_admin())
    with check (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers update own class orders"
    on class_orders for update
    using (auth.uid() = teacher_id or is_admin())
    with check (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers insert schedules for approved changes"
    on schedules for insert
    with check (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

alter table teacher_notifications
  add column if not exists request_id uuid references schedule_change_requests(id) on delete set null;

do $$ begin
  create policy "Students create schedule change notifications"
    on teacher_notifications for insert
    with check (
      auth.uid() = student_id
      and exists (
        select 1 from schedule_change_requests
        where id = request_id and student_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table schedule_change_requests;
exception when duplicate_object then null; when undefined_object then null; end $$;
