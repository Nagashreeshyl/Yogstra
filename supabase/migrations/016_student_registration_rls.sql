-- Students must be able to add themselves as participants and update their own registration.

drop policy if exists "Registrants can add participants" on public.competition_participants;
create policy "Registrants can add participants"
  on public.competition_participants for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.competition_registrations cr
      where cr.id = registration_id
        and cr.registrant_id = auth.uid()
        and cr.competition_id = competition_participants.competition_id
    )
  );

drop policy if exists "Registrants can update own registration" on public.competition_registrations;
create policy "Registrants can update own registration"
  on public.competition_registrations for update
  using (registrant_id = auth.uid())
  with check (registrant_id = auth.uid());

notify pgrst, 'reload schema';
