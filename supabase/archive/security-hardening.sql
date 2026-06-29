-- Security hardening: hide teacher bank details, tighten storage policies
-- Run once in Supabase Dashboard → SQL Editor

create table if not exists teacher_payout_private (
  teacher_id uuid primary key references profiles(id) on delete cascade,
  account_holder_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  razorpay_linked_account_id text,
  payout_onboarding_status text not null default 'not_started'
    check (payout_onboarding_status in ('not_started', 'pending', 'active', 'failed')),
  updated_at timestamptz not null default now()
);

alter table teacher_payout_private enable row level security;

do $$ begin
  create policy "Teachers read own payout private data"
    on teacher_payout_private for select
    using (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers update own payout private data"
    on teacher_payout_private for update
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers insert own payout private data"
    on teacher_payout_private for insert
    with check (auth.uid() = teacher_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin manage payout private data"
    on teacher_payout_private for all
    using (is_admin());
exception when duplicate_object then null;
end $$;

insert into teacher_payout_private (
  teacher_id,
  account_holder_name,
  bank_account_number,
  bank_ifsc,
  pan_number,
  razorpay_linked_account_id,
  payout_onboarding_status
)
select
  id,
  account_holder_name,
  bank_account_number,
  bank_ifsc,
  pan_number,
  razorpay_linked_account_id,
  payout_onboarding_status
from teacher_profiles
where
  account_holder_name is not null
  or bank_account_number is not null
  or bank_ifsc is not null
  or pan_number is not null
  or razorpay_linked_account_id is not null
  or payout_onboarding_status <> 'not_started'
on conflict (teacher_id) do update set
  account_holder_name = excluded.account_holder_name,
  bank_account_number = excluded.bank_account_number,
  bank_ifsc = excluded.bank_ifsc,
  pan_number = excluded.pan_number,
  razorpay_linked_account_id = excluded.razorpay_linked_account_id,
  payout_onboarding_status = excluded.payout_onboarding_status,
  updated_at = now();

alter table teacher_profiles
  drop column if exists account_holder_name,
  drop column if exists bank_account_number,
  drop column if exists bank_ifsc,
  drop column if exists pan_number,
  drop column if exists razorpay_linked_account_id,
  drop column if exists payout_onboarding_status;

-- Students must not read other students' payouts (teachers see own; admin sees all)
drop policy if exists "Admin can view all payouts" on payouts;
create policy "Teachers and admin can view payouts"
  on payouts for select
  using (is_admin() or auth.uid() = teacher_id);

-- Restrict post-media uploads to the uploader's folder
drop policy if exists "Authenticated users can upload post media" on storage.objects;
drop policy if exists "Users upload own post media" on storage.objects;

create policy "Users upload own post media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own post media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own post media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
