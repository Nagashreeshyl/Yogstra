-- Chat enhancements: edit/delete, thread settings, report snapshots, class orders
-- Run in Supabase Dashboard → SQL Editor (after setup-messaging.sql + chat-reports.sql)

-- Message edit / delete metadata
alter table direct_messages
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references profiles(id),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references profiles(id),
  add column if not exists delete_scope text check (delete_scope is null or delete_scope in ('self', 'both')),
  add column if not exists hidden_for uuid[] not null default '{}';

-- When a chat is deleted, messages before this time stay in DB but are hidden from both participants
alter table chat_threads
  add column if not exists history_cleared_at timestamptz;

-- Per-user thread preferences (mute, block, hide chat)
create table if not exists chat_thread_settings (
  thread_id uuid not null references chat_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  muted boolean not null default false,
  blocked boolean not null default false,
  hidden boolean not null default false,
  history_cleared_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table chat_thread_settings enable row level security;

do $$ begin
  create policy "Users manage own thread settings"
    on chat_thread_settings for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can view thread settings"
    on chat_thread_settings for select
    using (is_admin());
exception when duplicate_object then null;
end $$;

-- Report snapshots + review metadata
alter table chat_reports
  add column if not exists messages_snapshot jsonb,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references profiles(id);

-- Group class fee on teacher profiles
alter table teacher_profiles
  add column if not exists fee_group numeric;

-- Class purchase orders (Razorpay + schedule link)
create table if not exists class_orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  thread_id uuid references chat_threads(id) on delete set null,
  class_type text not null check (class_type in ('1:1', 'group')),
  scheduled_at timestamptz not null,
  notes text,
  amount numeric not null,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  razorpay_payment_id text,
  schedule_id uuid references schedules(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists class_orders_teacher_id_idx on class_orders(teacher_id);
create index if not exists class_orders_student_id_idx on class_orders(student_id);

alter table class_orders enable row level security;

do $$ begin
  create policy "Students can create class orders"
    on class_orders for insert
    with check (auth.uid() = student_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can view own class orders"
    on class_orders for select
    using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Students can update own pending orders"
    on class_orders for update
    using (auth.uid() = student_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can insert schedules from paid orders"
    on schedules for insert
    with check (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

-- Allow senders to edit/delete own messages
do $$ begin
  create policy "Users can update own direct messages"
    on direct_messages for update
    using (auth.uid() = sender_id)
    with check (auth.uid() = sender_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can update direct messages"
    on direct_messages for update
    using (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table chat_thread_settings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table class_orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
