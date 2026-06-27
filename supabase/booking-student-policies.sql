-- Allow students to create pending teacher requests
-- Run in Supabase Dashboard → SQL Editor (after schema.sql)

do $$ begin
  create policy "Students can create pending bookings"
    on bookings for insert
    with check (
      auth.uid() = student_id
      and status = 'pending'
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can update own booking status"
    on bookings for update
    using (auth.uid() = teacher_id or is_admin());
exception when duplicate_object then null;
end $$;
