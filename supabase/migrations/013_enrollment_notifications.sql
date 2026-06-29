-- Enrollment notifications for student, teacher, academy, and admin recipients after paid enrollment.

create table if not exists public.enrollment_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.class_orders(id) on delete set null,
  role text not null check (role in ('student', 'teacher', 'academy', 'admin')),
  type text not null default 'enrollment_success',
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_enrollment_notifications_user
  on public.enrollment_notifications(user_id, created_at desc);

create unique index if not exists idx_enrollment_notifications_order_role_user
  on public.enrollment_notifications(order_id, role, user_id)
  where order_id is not null;

alter table public.enrollment_notifications enable row level security;

do $$ begin
  create policy "Users read own enrollment notifications"
    on public.enrollment_notifications for select
    using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users mark own enrollment notifications read"
    on public.enrollment_notifications for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.enrollment_notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;
