-- Ensure competition creators can read/update their drafts immediately after insert
-- (fixes insert.returning 403 when security-definer helpers lag on new rows).

drop policy if exists "Creators can read own competitions" on public.competitions;
create policy "Creators can read own competitions"
  on public.competitions for select
  using (created_by = auth.uid() or organizer_id = auth.uid());

drop policy if exists "Creators can update own competitions" on public.competitions;
create policy "Creators can update own competitions"
  on public.competitions for update
  using (created_by = auth.uid() or organizer_id = auth.uid())
  with check (created_by = auth.uid() or organizer_id = auth.uid());

-- Replace FOR ALL policy (insert with-check on can_manage_competition fails for new rows).
drop policy if exists "Organizers can manage competitions" on public.competitions;

create policy "Organizers can manage competitions"
  on public.competitions for select
  using (can_manage_competition(id));

create policy "Organizers can delete competitions"
  on public.competitions for delete
  using (can_manage_competition(id));

notify pgrst, 'reload schema';
