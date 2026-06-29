-- Yogstra V2 — Migration 003: marketplace, payouts, private teacher payout data
-- Consolidates: marketplace-payouts.sql, security-hardening.sql, teacher-upi-payouts.sql
-- Payout bank/UPI data lives ONLY in teacher_payout_private (not teacher_profiles).

create table if not exists public.platform_settings (
  id text primary key default 'default',
  commission_percent numeric not null default 10
    check (commission_percent >= 0 and commission_percent <= 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.platform_settings (id, commission_percent)
values ('default', 10)
on conflict (id) do nothing;

create table if not exists public.teacher_payout_private (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  account_holder_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  upi_id text,
  razorpay_linked_account_id text,
  payout_onboarding_status text not null default 'not_started'
    check (payout_onboarding_status in ('not_started', 'pending', 'active', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend payouts ledger
alter table public.payouts
  add column if not exists class_order_id uuid references public.class_orders(id) on delete set null,
  add column if not exists student_id uuid references public.profiles(id) on delete set null,
  add column if not exists gross_amount numeric,
  add column if not exists commission_amount numeric,
  add column if not exists teacher_amount numeric,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_transfer_id text;

create unique index if not exists payouts_class_order_id_idx
  on public.payouts (class_order_id) where class_order_id is not null;

-- Remove duplicate payout columns from teacher_profiles if legacy migrations added them
alter table public.teacher_profiles
  drop column if exists account_holder_name,
  drop column if exists bank_account_number,
  drop column if exists bank_ifsc,
  drop column if exists pan_number,
  drop column if exists razorpay_linked_account_id,
  drop column if exists payout_onboarding_status,
  drop column if exists upi_id;

drop trigger if exists trg_teacher_payout_private_updated_at on public.teacher_payout_private;
create trigger trg_teacher_payout_private_updated_at
  before update on public.teacher_payout_private
  for each row execute function public.set_updated_at();

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.teacher_payout_private enable row level security;

do $$ begin create policy "Anyone authenticated can read platform settings" on public.platform_settings for select using (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin can update platform settings" on public.platform_settings for update using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Teachers read own payout private data" on public.teacher_payout_private for select using (auth.uid() = teacher_id or is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers update own payout private data" on public.teacher_payout_private for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Teachers insert own payout private data" on public.teacher_payout_private for insert with check (auth.uid() = teacher_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Admin manage payout private data" on public.teacher_payout_private for all using (is_admin()); exception when duplicate_object then null; end $$;

do $$ begin create policy "Admin can insert payouts" on public.payouts for insert with check (is_admin()); exception when duplicate_object then null; end $$;
