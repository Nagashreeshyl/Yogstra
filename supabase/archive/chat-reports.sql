-- Chat reports — admin sees conversations only when reported
-- Run in Supabase Dashboard → SQL Editor (after chat-threads.sql)

create table if not exists chat_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_user_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists chat_reports_thread_id_idx on chat_reports(thread_id);
create index if not exists chat_reports_status_idx on chat_reports(status);

alter table chat_reports enable row level security;

do $$ begin
  create policy "Participants can submit chat reports"
    on chat_reports for insert
    with check (
      auth.uid() = reporter_id
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
  create policy "Reporters can view own reports"
    on chat_reports for select
    using (auth.uid() = reporter_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can view all chat reports"
    on chat_reports for select
    using (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can update chat reports"
    on chat_reports for update
    using (is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table chat_reports;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
