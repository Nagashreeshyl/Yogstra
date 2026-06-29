-- Yogstra direct messaging setup (run once in Supabase Dashboard → SQL Editor)
-- Safe to re-run. Requires schema.sql (profiles + is_admin()) to exist first.
--
-- Run order:
--   1. supabase/schema.sql
--   2. supabase/auth-fix.sql (if not already applied)
--   3. This file (chat threads + read state + admin read policies)

-- === chat-threads.sql ===

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  requested_by uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_ordered check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_thread_id_idx on direct_messages(thread_id);
create index if not exists chat_threads_participant_a_idx on chat_threads(participant_a);
create index if not exists chat_threads_participant_b_idx on chat_threads(participant_b);

alter table chat_threads enable row level security;
alter table direct_messages enable row level security;

do $$ begin
  create policy "Users can view own chat threads"
    on chat_threads for select
    using (
      auth.uid() = participant_a
      or auth.uid() = participant_b
      or is_admin()
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can create chat threads"
    on chat_threads for insert
    with check (
      auth.uid() = requested_by
      and (auth.uid() = participant_a or auth.uid() = participant_b)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update chat threads"
    on chat_threads for update
    using (
      auth.uid() = participant_a
      or auth.uid() = participant_b
      or is_admin()
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can view direct messages in their threads"
    on direct_messages for select
    using (
      is_admin()
      or exists (
        select 1 from chat_threads t
        where t.id = thread_id
          and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
          and t.status = 'accepted'
      )
      or (
        auth.uid() = sender_id
        and exists (
          select 1 from chat_threads t
          where t.id = thread_id
            and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
        )
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can send direct messages in accepted threads"
    on direct_messages for insert
    with check (
      auth.uid() = sender_id
      and exists (
        select 1 from chat_threads t
        where t.id = thread_id
          and t.status = 'accepted'
          and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table direct_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table chat_threads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- === chat-reads.sql ===

create table if not exists chat_thread_reads (
  thread_id uuid not null references chat_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists chat_thread_reads_user_id_idx on chat_thread_reads(user_id);

alter table chat_thread_reads enable row level security;

do $$ begin
  create policy "Users can view own read state"
    on chat_thread_reads for select
    using (auth.uid() = user_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can upsert own read state"
    on chat_thread_reads for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own read state"
    on chat_thread_reads for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table chat_thread_reads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- === admin-chat-policies.sql ===

do $$ begin
  create policy "Admin can view all chat threads"
    on chat_threads for select
    using (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can view all direct messages"
    on direct_messages for select
    using (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can view all chat read state"
    on chat_thread_reads for select
    using (is_admin());
exception when duplicate_object then null;
end $$;
