-- Admin read access to direct messaging tables
-- Run in Supabase Dashboard → SQL Editor (after chat-threads.sql)

create policy "Admin can view all chat threads"
  on chat_threads for select
  using (is_admin());

create policy "Admin can view all direct messages"
  on direct_messages for select
  using (is_admin());

create policy "Admin can view all chat read state"
  on chat_thread_reads for select
  using (is_admin());
