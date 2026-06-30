-- Sprint 17: Beta operations — activity logs, audit trail, feedback, analytics

create table if not exists platform_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  role text,
  action text not null,
  entity_type text,
  entity_id text,
  status text not null default 'success' check (status in ('success', 'error', 'info')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_activity_log_created on platform_activity_log(created_at desc);
create index if not exists idx_platform_activity_log_user on platform_activity_log(user_id);
create index if not exists idx_platform_activity_log_action on platform_activity_log(action);
create index if not exists idx_platform_activity_log_status on platform_activity_log(status);

create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created on admin_audit_log(created_at desc);
create index if not exists idx_admin_audit_log_actor on admin_audit_log(actor_id);
create index if not exists idx_admin_audit_log_entity on admin_audit_log(entity_type, entity_id);

create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  role text,
  category text not null check (category in ('bug', 'suggestion', 'feature', 'general')),
  message text not null,
  page_url text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_beta_feedback_created on beta_feedback(created_at desc);
create index if not exists idx_beta_feedback_status on beta_feedback(status);

create table if not exists platform_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references profiles(id) on delete set null,
  role text,
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_analytics_event on platform_analytics_events(event_name);
create index if not exists idx_platform_analytics_created on platform_analytics_events(created_at desc);

alter table platform_activity_log enable row level security;
alter table admin_audit_log enable row level security;
alter table beta_feedback enable row level security;
alter table platform_analytics_events enable row level security;

do $$ begin
  create policy "Users insert own activity"
    on platform_activity_log for insert
    with check (auth.uid() = user_id or user_id is null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin read activity log"
    on platform_activity_log for select
    using (is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin insert audit log"
    on admin_audit_log for insert
    with check (is_admin() and auth.uid() = actor_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin read audit log"
    on admin_audit_log for select
    using (is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated submit feedback"
    on beta_feedback for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own feedback"
    on beta_feedback for select
    using (auth.uid() = user_id or is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin update feedback"
    on beta_feedback for update
    using (is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated track analytics"
    on platform_analytics_events for insert
    with check (user_id is null or auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admin read analytics"
    on platform_analytics_events for select
    using (is_admin());
exception when duplicate_object then null; end $$;

drop trigger if exists trg_beta_feedback_updated_at on beta_feedback;
create trigger trg_beta_feedback_updated_at
  before update on beta_feedback
  for each row execute function public.set_updated_at();
