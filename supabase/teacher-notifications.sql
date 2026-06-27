-- Teacher notifications (class bookings, etc.)
-- Run in Supabase Dashboard → SQL Editor (safe to re-run)

create table if not exists teacher_notifications (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  student_id uuid references profiles(id) on delete set null,
  order_id uuid references class_orders(id) on delete set null,
  type text not null default 'class_booking',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists teacher_notifications_teacher_id_idx
  on teacher_notifications(teacher_id, created_at desc);

alter table teacher_notifications enable row level security;

do $$ begin
  create policy "Teachers read own notifications"
    on teacher_notifications for select
    using (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers mark own notifications read"
    on teacher_notifications for update
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Students create booking notifications"
    on teacher_notifications for insert
    with check (
      exists (
        select 1 from class_orders
        where id = order_id and student_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Allow students to create schedule rows when their class order is paid
do $$ begin
  create policy "Students insert schedules for paid class orders"
    on schedules for insert
    with check (auth.uid() = student_id or auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table teacher_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
