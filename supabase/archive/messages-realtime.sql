-- Enable real-time message delivery. Run once in Supabase SQL Editor.

alter publication supabase_realtime add table messages;

-- Restrict message inserts to participants on active bookings
drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from bookings
      where id = booking_id
        and status = 'active'
        and (student_id = auth.uid() or teacher_id = auth.uid())
    )
  );
