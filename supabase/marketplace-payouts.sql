-- Marketplace payouts: commission settings, teacher bank details, auto payout records
-- Run once in Supabase Dashboard → SQL Editor

-- Platform commission (default 10%)
create table if not exists platform_settings (
  id text primary key default 'default',
  commission_percent numeric not null default 10
    check (commission_percent >= 0 and commission_percent <= 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

insert into platform_settings (id, commission_percent)
values ('default', 10)
on conflict (id) do nothing;

alter table platform_settings enable row level security;

do $$ begin
  create policy "Anyone authenticated can read platform settings"
    on platform_settings for select
    using (auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin can update platform settings"
    on platform_settings for update
    using (is_admin());
exception when duplicate_object then null;
end $$;

-- Teacher payout / bank details
alter table teacher_profiles
  add column if not exists account_holder_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_ifsc text,
  add column if not exists pan_number text,
  add column if not exists razorpay_linked_account_id text,
  add column if not exists payout_onboarding_status text not null default 'not_started'
    check (payout_onboarding_status in ('not_started', 'pending', 'active', 'failed'));

-- Class order payment split fields
alter table class_orders
  add column if not exists gross_amount numeric,
  add column if not exists platform_fee numeric,
  add column if not exists teacher_amount numeric,
  add column if not exists commission_percent numeric,
  add column if not exists razorpay_order_id text,
  add column if not exists transfer_status text default 'pending'
    check (transfer_status in ('pending', 'transferred', 'held', 'not_applicable'));

create unique index if not exists class_orders_razorpay_order_id_idx
  on class_orders (razorpay_order_id)
  where razorpay_order_id is not null;

create unique index if not exists class_orders_razorpay_payment_id_idx
  on class_orders (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- Richer payout ledger linked to class orders
alter table payouts
  add column if not exists class_order_id uuid references class_orders(id) on delete set null,
  add column if not exists student_id uuid references profiles(id) on delete set null,
  add column if not exists gross_amount numeric,
  add column if not exists commission_amount numeric,
  add column if not exists teacher_amount numeric,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_transfer_id text;

create unique index if not exists payouts_class_order_id_idx
  on payouts (class_order_id)
  where class_order_id is not null;

-- Teachers can update own payout bank fields
do $$ begin
  create policy "Teachers can update own payout bank details"
    on teacher_profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Service role / admin inserts payouts (webhook uses service role)
do $$ begin
  create policy "Admin can insert payouts"
    on payouts for insert
    with check (is_admin());
exception when duplicate_object then null;
end $$;

-- Realtime for platform settings (optional admin UI)
do $$ begin
  alter publication supabase_realtime add table platform_settings;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- Backfill payout rows for paid class orders created before this migration
insert into payouts (
  teacher_id,
  class_order_id,
  student_id,
  gross_amount,
  commission_amount,
  teacher_amount,
  amount,
  period,
  status,
  razorpay_payment_id
)
select
  o.teacher_id,
  o.id,
  o.student_id,
  coalesce(o.gross_amount, o.amount),
  coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2)),
  coalesce(o.teacher_amount, coalesce(o.gross_amount, o.amount) - coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2))),
  coalesce(o.teacher_amount, coalesce(o.gross_amount, o.amount) - coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2))),
  coalesce(p.full_name, 'Student') || ' · ' || to_char(o.created_at, 'DD Mon YYYY'),
  'pending',
  o.razorpay_payment_id
from class_orders o
left join profiles p on p.id = o.student_id
where o.payment_status = 'paid'
  and not exists (select 1 from payouts pay where pay.class_order_id = o.id);
