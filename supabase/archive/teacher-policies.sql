-- Allow teachers to accept/decline pending booking requests.
-- Run once in Supabase SQL Editor.

drop policy if exists "Teachers can update own bookings" on bookings;
create policy "Teachers can update own bookings"
  on bookings for update
  using (auth.uid() = teacher_id);

drop policy if exists "Teachers can update own teacher profile settings" on teacher_profiles;
create policy "Teachers can update own teacher profile settings"
  on teacher_profiles for update
  using (auth.uid() = id);
