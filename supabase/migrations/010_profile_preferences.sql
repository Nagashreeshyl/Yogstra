-- Yogstra V2 — Migration 010: persisted user workspace preferences

create table if not exists public.profile_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_workspace text check (
    preferred_workspace is null or preferred_workspace in (
      'student', 'teacher', 'academy', 'organizer', 'judge', 'admin'
    )
  ),
  preferred_academy_id uuid references public.academies(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_preferences_academy
  on public.profile_preferences(preferred_academy_id)
  where preferred_academy_id is not null;

alter table public.profile_preferences enable row level security;

create policy "Users read own preferences"
  on public.profile_preferences for select
  using (auth.uid() = user_id);

create policy "Users upsert own preferences"
  on public.profile_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.profile_preferences for update
  using (auth.uid() = user_id);
