-- Track last-read time per user per chat thread (for unread notifications)
-- Run in Supabase Dashboard → SQL Editor (after chat-threads.sql)
-- Safe to re-run: skips objects that already exist.

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

-- Enable realtime for read-state sync across tabs
do $$ begin
  alter publication supabase_realtime add table chat_thread_reads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
