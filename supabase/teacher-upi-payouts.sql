-- Teacher UPI ID for manual admin payouts
-- Run once in Supabase Dashboard → SQL Editor

alter table teacher_payout_private
  add column if not exists upi_id text;

alter table teacher_profiles
  add column if not exists upi_id text;

do $$ begin
  create policy "Admin read teacher payout private"
    on teacher_payout_private for select
    using (is_admin());
exception when duplicate_object then null;
end $$;
