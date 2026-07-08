-- Students must update their own participant row (documents, emergency contact metadata).

drop policy if exists "Students can update own participant profile" on public.competition_participants;
create policy "Students can update own participant profile"
  on public.competition_participants for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

notify pgrst, 'reload schema';
