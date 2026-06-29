-- Student booking policies (run in Supabase Dashboard → SQL Editor after schema.sql)
-- Bookings are created only after successful payment — no pending accept/decline flow.

drop policy if exists "Students can create pending bookings" on bookings;

do $$ begin
  create policy "Students can create paid bookings"
    on bookings for insert
    with check (
      auth.uid() = student_id
      and status = 'active'
      and payment_status = 'paid'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Students can activate own bookings after payment"
    on bookings for update
    using (auth.uid() = student_id and status = 'pending')
    with check (
      auth.uid() = student_id
      and status = 'active'
      and payment_status = 'paid'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can update own booking status"
    on bookings for update
    using (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;
