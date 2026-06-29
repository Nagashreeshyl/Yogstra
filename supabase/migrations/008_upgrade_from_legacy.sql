-- Yogstra V2 — Migration 008: upgrade patches for existing legacy databases
-- Run AFTER legacy ad-hoc migrations OR when consolidating an existing Supabase project.
-- Idempotent. Does not change application behavior.

-- ---------------------------------------------------------------------------
-- Standardize timestamps on legacy core tables
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists gender text check (gender is null or gender in ('male', 'female'));
alter table public.categories add column if not exists updated_at timestamptz not null default now();
alter table public.teacher_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.teacher_profiles add column if not exists created_at timestamptz not null default now();
alter table public.bookings add column if not exists updated_at timestamptz not null default now();
alter table public.schedules add column if not exists updated_at timestamptz not null default now();
alter table public.posts add column if not exists updated_at timestamptz not null default now();
alter table public.posts add column if not exists pinned boolean not null default false;
alter table public.comments add column if not exists updated_at timestamptz not null default now();
alter table public.messages add column if not exists updated_at timestamptz not null default now();
alter table public.payouts add column if not exists updated_at timestamptz not null default now();
alter table public.direct_messages add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Ensure teacher pricing columns exist
-- ---------------------------------------------------------------------------

alter table public.teacher_profiles
  add column if not exists fee_group numeric,
  add column if not exists fee_1v1_week numeric,
  add column if not exists fee_1v1_month numeric,
  add column if not exists fee_group_week numeric,
  add column if not exists fee_group_month numeric,
  add column if not exists cover_url text;

-- ---------------------------------------------------------------------------
-- Consolidate payout data: teacher_profiles → teacher_payout_private
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_profiles' and column_name = 'bank_account_number'
  ) then
    insert into public.teacher_payout_private (
      teacher_id, account_holder_name, bank_account_number, bank_ifsc, pan_number,
      razorpay_linked_account_id, payout_onboarding_status, upi_id
    )
    select
      tp.id,
      tp.account_holder_name,
      tp.bank_account_number,
      tp.bank_ifsc,
      tp.pan_number,
      tp.razorpay_linked_account_id,
      coalesce(tp.payout_onboarding_status, 'not_started'),
      tp.upi_id
    from public.teacher_profiles tp
    where tp.account_holder_name is not null
       or tp.bank_account_number is not null
       or tp.upi_id is not null
    on conflict (teacher_id) do update set
      account_holder_name = coalesce(excluded.account_holder_name, public.teacher_payout_private.account_holder_name),
      bank_account_number = coalesce(excluded.bank_account_number, public.teacher_payout_private.bank_account_number),
      bank_ifsc = coalesce(excluded.bank_ifsc, public.teacher_payout_private.bank_ifsc),
      pan_number = coalesce(excluded.pan_number, public.teacher_payout_private.pan_number),
      upi_id = coalesce(excluded.upi_id, public.teacher_payout_private.upi_id),
      razorpay_linked_account_id = coalesce(excluded.razorpay_linked_account_id, public.teacher_payout_private.razorpay_linked_account_id),
      payout_onboarding_status = excluded.payout_onboarding_status,
      updated_at = now();

    alter table public.teacher_profiles
      drop column if exists account_holder_name,
      drop column if exists bank_account_number,
      drop column if exists bank_ifsc,
      drop column if exists pan_number,
      drop column if exists razorpay_linked_account_id,
      drop column if exists payout_onboarding_status,
      drop column if exists upi_id;
  end if;
end $$;

-- Migrate UPI-only legacy rows on teacher_profiles
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teacher_profiles' and column_name = 'upi_id'
  ) then
    insert into public.teacher_payout_private (teacher_id, upi_id)
    select id, upi_id from public.teacher_profiles where upi_id is not null
    on conflict (teacher_id) do update set upi_id = excluded.upi_id, updated_at = now();

    alter table public.teacher_profiles drop column if exists upi_id;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Add missing indexes (safe if exists)
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_posts_pinned_created on public.posts(pinned desc, created_at desc);

-- ---------------------------------------------------------------------------
-- Attach updated_at triggers where missing
-- ---------------------------------------------------------------------------

do $$ declare t text; begin
  foreach t in array array[
    'profiles', 'categories', 'teacher_profiles', 'bookings', 'schedules',
    'posts', 'comments', 'messages', 'payouts', 'direct_messages'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Tighten legacy payouts SELECT policy
-- ---------------------------------------------------------------------------

drop policy if exists "Admin can view all payouts" on public.payouts;
drop policy if exists "Teachers and admin can view payouts" on public.payouts;
create policy "Teachers and admin can view payouts"
  on public.payouts for select
  using (is_admin() or auth.uid() = teacher_id);

-- ---------------------------------------------------------------------------
-- Backfill payout rows for paid class orders (idempotent)
-- ---------------------------------------------------------------------------

insert into public.payouts (
  teacher_id, class_order_id, student_id, gross_amount, commission_amount,
  teacher_amount, amount, period, status, razorpay_payment_id
)
select
  o.teacher_id, o.id, o.student_id,
  coalesce(o.gross_amount, o.amount),
  coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2)),
  coalesce(o.teacher_amount, coalesce(o.gross_amount, o.amount) - coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2))),
  coalesce(o.teacher_amount, coalesce(o.gross_amount, o.amount) - coalesce(o.platform_fee, round(coalesce(o.gross_amount, o.amount) * 0.10, 2))),
  coalesce(p.full_name, 'Student') || ' · ' || to_char(o.created_at, 'DD Mon YYYY'),
  'pending', o.razorpay_payment_id
from public.class_orders o
left join public.profiles p on p.id = o.student_id
where o.payment_status = 'paid'
  and not exists (select 1 from public.payouts pay where pay.class_order_id = o.id);
