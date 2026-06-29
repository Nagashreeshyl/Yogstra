-- Yogstra V2 — Migration 002: chat, class orders, reports, video calls
-- Consolidates: setup-messaging.sql, chat-reports.sql, chat-enhancements.sql,
--                 direct-video-calls.sql, messages-realtime.sql (legacy messages policy)

-- ---------------------------------------------------------------------------
-- Chat threads & direct messages
-- ---------------------------------------------------------------------------

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  history_cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_ordered check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  edited_at timestamptz,
  edited_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  delete_scope text check (delete_scope is null or delete_scope in ('self', 'both')),
  hidden_for uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_thread_reads (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_thread_settings (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted boolean not null default false,
  blocked boolean not null default false,
  hidden boolean not null default false,
  history_cleared_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  messages_snapshot jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Class orders (Razorpay checkout)
-- ---------------------------------------------------------------------------

create table if not exists public.class_orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid references public.chat_threads(id) on delete set null,
  class_type text not null check (class_type in ('1:1', 'group')),
  duration text check (duration is null or duration in ('week', 'month')),
  scheduled_at timestamptz not null,
  notes text,
  amount numeric not null,
  gross_amount numeric,
  platform_fee numeric,
  teacher_amount numeric,
  commission_percent numeric,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  transfer_status text default 'pending'
    check (transfer_status in ('pending', 'transferred', 'held', 'not_applicable')),
  schedule_id uuid references public.schedules(id) on delete set null,
  discount_percent numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists class_orders_razorpay_order_id_idx
  on public.class_orders (razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists class_orders_razorpay_payment_id_idx
  on public.class_orders (razorpay_payment_id) where razorpay_payment_id is not null;

-- ---------------------------------------------------------------------------
-- Direct video calls
-- ---------------------------------------------------------------------------

create table if not exists public.direct_video_calls (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  room_name text not null unique,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists direct_messages_thread_id_idx on public.direct_messages(thread_id);
create index if not exists chat_threads_participant_a_idx on public.chat_threads(participant_a);
create index if not exists chat_threads_participant_b_idx on public.chat_threads(participant_b);
create index if not exists chat_thread_reads_user_id_idx on public.chat_thread_reads(user_id);
create index if not exists chat_reports_thread_id_idx on public.chat_reports(thread_id);
create index if not exists chat_reports_status_idx on public.chat_reports(status);
create index if not exists class_orders_teacher_id_idx on public.class_orders(teacher_id);
create index if not exists class_orders_student_id_idx on public.class_orders(student_id);
create index if not exists direct_video_calls_thread_idx on public.direct_video_calls(thread_id, created_at desc);
create index if not exists direct_video_calls_caller_idx on public.direct_video_calls(caller_id, created_at desc);
create index if not exists direct_video_calls_callee_idx on public.direct_video_calls(callee_id, created_at desc);
create index if not exists direct_video_calls_status_idx on public.direct_video_calls(status);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$ declare t text; begin
  foreach t in array array[
    'chat_threads', 'direct_messages', 'chat_reports', 'class_orders', 'direct_video_calls'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

drop trigger if exists trg_chat_thread_settings_updated_at on public.chat_thread_settings;
create trigger trg_chat_thread_settings_updated_at
  before update on public.chat_thread_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.chat_threads enable row level security;
alter table public.direct_messages enable row level security;
alter table public.chat_thread_reads enable row level security;
alter table public.chat_thread_settings enable row level security;
alter table public.chat_reports enable row level security;
alter table public.class_orders enable row level security;
alter table public.direct_video_calls enable row level security;

do $$ begin create policy "Users can view own chat threads" on public.chat_threads for select using (auth.uid() = participant_a or auth.uid() = participant_b or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can create chat threads" on public.chat_threads for insert with check (auth.uid() = requested_by and (auth.uid() = participant_a or auth.uid() = participant_b)); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update chat threads" on public.chat_threads for update using (auth.uid() = participant_a or auth.uid() = participant_b or is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view direct messages in their threads" on public.direct_messages for select using (
  is_admin() or exists (select 1 from public.chat_threads t where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid()) and t.status = 'accepted')
  or (auth.uid() = sender_id and exists (select 1 from public.chat_threads t where t.id = thread_id and (t.participant_a = auth.uid() or t.participant_b = auth.uid())))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can send direct messages in accepted threads" on public.direct_messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.chat_threads t where t.id = thread_id and t.status = 'accepted' and (t.participant_a = auth.uid() or t.participant_b = auth.uid()))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update own direct messages" on public.direct_messages for update using (auth.uid() = sender_id) with check (auth.uid() = sender_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update direct messages" on public.direct_messages for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users can view own read state" on public.chat_thread_reads for select using (auth.uid() = user_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can upsert own read state" on public.chat_thread_reads for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can update own read state" on public.chat_thread_reads for update using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;

do $$ begin create policy "Users manage own thread settings" on public.chat_thread_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can view thread settings" on public.chat_thread_settings for select using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Participants can submit chat reports" on public.chat_reports for insert with check (
  auth.uid() = reporter_id and exists (select 1 from public.chat_threads t where t.id = thread_id and t.status = 'accepted' and (t.participant_a = auth.uid() or t.participant_b = auth.uid()))
); exception when duplicate_object then null; end $$;
do $$ begin create policy "Reporters can view own reports" on public.chat_reports for select using (auth.uid() = reporter_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update chat reports" on public.chat_reports for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Students can create class orders" on public.class_orders for insert with check (auth.uid() = student_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can view own class orders" on public.class_orders for select using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students can update own pending orders" on public.class_orders for update using (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Call participants can view calls" on public.direct_video_calls for select using (auth.uid() = caller_id or auth.uid() = callee_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Call participants can create calls" on public.direct_video_calls for insert with check (auth.uid() = caller_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Call participants can update calls" on public.direct_video_calls for update using (auth.uid() = caller_id or auth.uid() = callee_id or is_admin()); exception when duplicate_object then null; end $$;

-- Schedule insert policies (class orders + teacher flows)
do $$ begin create policy "Teachers insert schedules from paid orders" on public.schedules for insert with check (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Students insert schedules for paid class orders" on public.schedules for insert with check (auth.uid() = student_id or auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;

alter table public.direct_video_calls replica identity full;
