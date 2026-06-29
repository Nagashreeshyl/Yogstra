-- Per-user chat history archive timestamp (messages stay in direct_messages for admin)
alter table chat_thread_settings
  add column if not exists history_cleared_at timestamptz;

-- Legacy thread-level cutoff (optional, kept for backward compatibility)
alter table chat_threads
  add column if not exists history_cleared_at timestamptz;
