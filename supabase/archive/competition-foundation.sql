-- Competition Foundation (V2 Core Domain)
-- Additive migration — does NOT modify or drop existing tables.
-- Run once in Supabase Dashboard → SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- Competitions
-- ---------------------------------------------------------------------------

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  organizer_id uuid references profiles(id) on delete set null,
  academy_id uuid references academies(id) on delete set null,
  venue text,
  city text,
  state text,
  country text not null default 'IN',
  start_date date,
  end_date date,
  registration_deadline timestamptz,
  entry_fee numeric(12, 2) not null default 0,
  format text not null default 'individual'
    check (format in ('individual', 'team', 'online')),
  scope text not null default 'friendly'
    check (scope in ('friendly', 'state', 'national', 'international')),
  status text not null default 'draft'
    check (status in (
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'scoring',
      'results_pending',
      'completed',
      'archived'
    )),
  max_participants integer check (max_participants is null or max_participants > 0),
  rules text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_slug_unique unique (slug),
  constraint competitions_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index if not exists idx_competitions_organizer on competitions(organizer_id);
create index if not exists idx_competitions_academy on competitions(academy_id);
create index if not exists idx_competitions_status on competitions(status);
create index if not exists idx_competitions_start_date on competitions(start_date);
create index if not exists idx_competitions_scope on competitions(scope);

-- ---------------------------------------------------------------------------
-- Competition events (stages / sessions within a competition)
-- ---------------------------------------------------------------------------

create table if not exists competition_events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  venue text,
  stage text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  sort_order integer not null default 0,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_events_competition on competition_events(competition_id);
create index if not exists idx_competition_events_starts_at on competition_events(competition_id, starts_at);

-- ---------------------------------------------------------------------------
-- Competition categories (age group + style)
-- ---------------------------------------------------------------------------

create table if not exists competition_categories (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  age_group text check (age_group is null or age_group in (
    'under_8', 'under_10', 'under_12', 'under_14', 'under_16', 'under_18', 'open', 'masters'
  )),
  style_type text check (style_type is null or style_type in (
    'traditional', 'artistic', 'rhythmic', 'pair', 'group'
  )),
  difficulty text check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')),
  max_participants integer check (max_participants is null or max_participants > 0),
  entry_fee_override numeric(12, 2),
  sort_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_categories_competition on competition_categories(competition_id);
create index if not exists idx_competition_categories_status on competition_categories(competition_id, status);

-- ---------------------------------------------------------------------------
-- Competition divisions (sub-groups within a category)
-- ---------------------------------------------------------------------------

create table if not exists competition_divisions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references competition_categories(id) on delete cascade,
  name text not null,
  code text,
  max_participants integer check (max_participants is null or max_participants > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_divisions_category on competition_divisions(category_id);

-- ---------------------------------------------------------------------------
-- Competition registrations
-- ---------------------------------------------------------------------------

create table if not exists competition_registrations (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  category_id uuid references competition_categories(id) on delete set null,
  division_id uuid references competition_divisions(id) on delete set null,
  registrant_id uuid not null references profiles(id) on delete cascade,
  registrant_type text not null default 'student'
    check (registrant_type in ('student', 'teacher', 'academy', 'organizer')),
  academy_id uuid references academies(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'partial', 'waived')),
  payment_amount numeric(12, 2),
  payment_reference text,
  notes text,
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_registrations_competition on competition_registrations(competition_id);
create index if not exists idx_competition_registrations_registrant on competition_registrations(registrant_id);
create index if not exists idx_competition_registrations_status on competition_registrations(competition_id, status);
create index if not exists idx_competition_registrations_academy on competition_registrations(academy_id)
  where academy_id is not null;

-- ---------------------------------------------------------------------------
-- Competition participants
-- ---------------------------------------------------------------------------

create table if not exists competition_participants (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references competition_registrations(id) on delete cascade,
  competition_id uuid not null references competitions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references competition_categories(id) on delete restrict,
  division_id uuid references competition_divisions(id) on delete set null,
  display_name text not null,
  date_of_birth date,
  gender text,
  academy_id uuid references academies(id) on delete set null,
  teacher_id uuid references profiles(id) on delete set null,
  status text not null default 'registered'
    check (status in (
      'registered', 'checked_in', 'performing', 'completed', 'withdrawn', 'disqualified'
    )),
  check_in_at timestamptz,
  documents_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_participants_unique_student unique (competition_id, student_id, category_id)
);

create index if not exists idx_competition_participants_competition on competition_participants(competition_id);
create index if not exists idx_competition_participants_student on competition_participants(student_id);
create index if not exists idx_competition_participants_registration on competition_participants(registration_id);
create index if not exists idx_competition_participants_category on competition_participants(category_id);

-- ---------------------------------------------------------------------------
-- Competition judges
-- ---------------------------------------------------------------------------

create table if not exists competition_judges (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'judge'
    check (role in ('head_judge', 'judge', 'scorer', 'technical')),
  category_id uuid references competition_categories(id) on delete set null,
  event_id uuid references competition_events(id) on delete set null,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'inactive', 'removed')),
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_judges_unique unique (competition_id, user_id)
);

create index if not exists idx_competition_judges_competition on competition_judges(competition_id);
create index if not exists idx_competition_judges_user on competition_judges(user_id);

-- ---------------------------------------------------------------------------
-- Competition scores
-- ---------------------------------------------------------------------------

create table if not exists competition_scores (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid not null references competition_participants(id) on delete cascade,
  judge_id uuid not null references competition_judges(id) on delete cascade,
  category_id uuid references competition_categories(id) on delete set null,
  event_id uuid references competition_events(id) on delete set null,
  criteria jsonb not null default '{}'::jsonb,
  total_score numeric(8, 2) not null default 0,
  comments text,
  submitted_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_scores_unique unique (participant_id, judge_id, event_id)
);

create index if not exists idx_competition_scores_competition on competition_scores(competition_id);
create index if not exists idx_competition_scores_participant on competition_scores(participant_id);
create index if not exists idx_competition_scores_judge on competition_scores(judge_id);

-- ---------------------------------------------------------------------------
-- Competition results
-- ---------------------------------------------------------------------------

create table if not exists competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid not null references competition_participants(id) on delete cascade,
  category_id uuid not null references competition_categories(id) on delete restrict,
  division_id uuid references competition_divisions(id) on delete set null,
  rank integer check (rank is null or rank > 0),
  total_score numeric(8, 2),
  medal text check (medal is null or medal in ('gold', 'silver', 'bronze', 'participation')),
  status text not null default 'provisional'
    check (status in ('provisional', 'approved', 'published')),
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_results_unique_participant unique (participant_id)
);

create index if not exists idx_competition_results_competition on competition_results(competition_id);
create index if not exists idx_competition_results_category on competition_results(category_id, rank);

-- ---------------------------------------------------------------------------
-- Competition certificates (QR verification + digital signatures ready)
-- ---------------------------------------------------------------------------

create table if not exists competition_certificates (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  participant_id uuid references competition_participants(id) on delete set null,
  result_id uuid references competition_results(id) on delete set null,
  certificate_type text not null default 'participation'
    check (certificate_type in ('participation', 'merit', 'winner', 'judge')),
  recipient_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  qr_code_token text not null,
  verification_url text,
  signature_data jsonb not null default '{}'::jsonb,
  pdf_url text,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_certificates_qr_unique unique (qr_code_token)
);

create index if not exists idx_competition_certificates_competition on competition_certificates(competition_id);
create index if not exists idx_competition_certificates_recipient on competition_certificates(recipient_id);
create index if not exists idx_competition_certificates_qr on competition_certificates(qr_code_token);

-- ---------------------------------------------------------------------------
-- Competition rankings (student / teacher / academy / state / national)
-- ---------------------------------------------------------------------------

create table if not exists competition_rankings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references competitions(id) on delete cascade,
  scope text not null
    check (scope in ('student', 'teacher', 'academy', 'state', 'national', 'international')),
  subject_type text not null
    check (subject_type in ('student', 'teacher', 'academy')),
  subject_id uuid not null,
  category_id uuid references competition_categories(id) on delete set null,
  period_start date,
  period_end date,
  rank integer not null check (rank > 0),
  points numeric(12, 2) not null default 0,
  season text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_rankings_scope on competition_rankings(scope, rank);
create index if not exists idx_competition_rankings_subject on competition_rankings(subject_type, subject_id);
create index if not exists idx_competition_rankings_competition on competition_rankings(competition_id)
  where competition_id is not null;
create index if not exists idx_competition_rankings_season on competition_rankings(season, scope);

-- ---------------------------------------------------------------------------
-- Competition announcements
-- ---------------------------------------------------------------------------

create table if not exists competition_announcements (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all'
    check (audience in ('all', 'participants', 'judges', 'organizers', 'public')),
  published_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_competition_announcements_competition on competition_announcements(competition_id);
create index if not exists idx_competition_announcements_published on competition_announcements(competition_id, status)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_competition_organizer(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competitions c
    where c.id = target_competition_id
      and (
        c.organizer_id = auth.uid()
        or c.created_by = auth.uid()
      )
  )
  or (
    exists (
      select 1
      from competitions c
      join academy_members am on am.academy_id = c.academy_id
      where c.id = target_competition_id
        and am.user_id = auth.uid()
        and am.status = 'active'
        and am.role in ('owner', 'manager')
    )
  );
$$;

create or replace function public.is_competition_judge(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competition_judges cj
    where cj.competition_id = target_competition_id
      and cj.user_id = auth.uid()
      and cj.status = 'active'
  );
$$;

create or replace function public.is_competition_participant(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from competition_participants cp
    where cp.competition_id = target_competition_id
      and cp.student_id = auth.uid()
  )
  or exists (
    select 1
    from competition_registrations cr
    where cr.competition_id = target_competition_id
      and cr.registrant_id = auth.uid()
      and cr.status in ('pending', 'confirmed', 'waitlisted')
  );
$$;

create or replace function public.can_manage_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or is_competition_organizer(target_competition_id);
$$;

create or replace function public.can_view_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin()
    or is_competition_organizer(target_competition_id)
    or is_competition_judge(target_competition_id)
    or is_competition_participant(target_competition_id)
    or exists (
      select 1
      from competitions c
      where c.id = target_competition_id
        and c.status in (
          'published',
          'registration_open',
          'registration_closed',
          'in_progress',
          'scoring',
          'results_pending',
          'completed'
        )
    );
$$;

create or replace function public.can_register_for_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from competitions c
      where c.id = target_competition_id
        and c.status = 'registration_open'
        and (c.registration_deadline is null or c.registration_deadline > now())
    );
$$;

create or replace function public.can_score_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or is_competition_judge(target_competition_id);
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_competitions_updated_at on competitions;
create trigger trg_competitions_updated_at
  before update on competitions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_events_updated_at on competition_events;
create trigger trg_competition_events_updated_at
  before update on competition_events
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_categories_updated_at on competition_categories;
create trigger trg_competition_categories_updated_at
  before update on competition_categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_divisions_updated_at on competition_divisions;
create trigger trg_competition_divisions_updated_at
  before update on competition_divisions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_registrations_updated_at on competition_registrations;
create trigger trg_competition_registrations_updated_at
  before update on competition_registrations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_participants_updated_at on competition_participants;
create trigger trg_competition_participants_updated_at
  before update on competition_participants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_judges_updated_at on competition_judges;
create trigger trg_competition_judges_updated_at
  before update on competition_judges
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_scores_updated_at on competition_scores;
create trigger trg_competition_scores_updated_at
  before update on competition_scores
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_results_updated_at on competition_results;
create trigger trg_competition_results_updated_at
  before update on competition_results
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_certificates_updated_at on competition_certificates;
create trigger trg_competition_certificates_updated_at
  before update on competition_certificates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_rankings_updated_at on competition_rankings;
create trigger trg_competition_rankings_updated_at
  before update on competition_rankings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_competition_announcements_updated_at on competition_announcements;
create trigger trg_competition_announcements_updated_at
  before update on competition_announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table competitions enable row level security;
alter table competition_events enable row level security;
alter table competition_categories enable row level security;
alter table competition_divisions enable row level security;
alter table competition_registrations enable row level security;
alter table competition_participants enable row level security;
alter table competition_judges enable row level security;
alter table competition_scores enable row level security;
alter table competition_results enable row level security;
alter table competition_certificates enable row level security;
alter table competition_rankings enable row level security;
alter table competition_announcements enable row level security;

-- Competitions
do $$ begin
  create policy "Public can view published competitions"
    on competitions for select
    using (can_view_competition(id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage competitions"
    on competitions for all
    using (can_manage_competition(id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can create competitions"
    on competitions for insert
    with check (auth.uid() is not null and created_by = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin manage competitions"
    on competitions for all
    using (is_admin());
exception when duplicate_object then null;
end $$;

-- Competition events
do $$ begin
  create policy "Competition viewers can read events"
    on competition_events for select
    using (can_view_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage events"
    on competition_events for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition categories
do $$ begin
  create policy "Competition viewers can read categories"
    on competition_categories for select
    using (can_view_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage categories"
    on competition_categories for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition divisions
do $$ begin
  create policy "Competition viewers can read divisions"
    on competition_divisions for select
    using (
      is_admin()
      or exists (
        select 1 from competition_categories cc
        where cc.id = competition_divisions.category_id
          and can_view_competition(cc.competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage divisions"
    on competition_divisions for all
    using (
      is_admin()
      or exists (
        select 1 from competition_categories cc
        where cc.id = competition_divisions.category_id
          and can_manage_competition(cc.competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition registrations
do $$ begin
  create policy "Registrants and organizers can view registrations"
    on competition_registrations for select
    using (
      is_admin()
      or registrant_id = auth.uid()
      or can_manage_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can submit registrations when open"
    on competition_registrations for insert
    with check (
      auth.uid() = registrant_id
      and can_register_for_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage registrations"
    on competition_registrations for update
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition participants
do $$ begin
  create policy "Participants and organizers can view participants"
    on competition_participants for select
    using (
      is_admin()
      or student_id = auth.uid()
      or can_manage_competition(competition_id)
      or is_competition_judge(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage participants"
    on competition_participants for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition judges
do $$ begin
  create policy "Judges and organizers can view judge roster"
    on competition_judges for select
    using (
      is_admin()
      or user_id = auth.uid()
      or can_manage_competition(competition_id)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage judges"
    on competition_judges for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition scores
do $$ begin
  create policy "Judges and organizers can view scores"
    on competition_scores for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Assigned judges can submit scores"
    on competition_scores for insert
    with check (
      is_admin()
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
          and cj.status = 'active'
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Assigned judges can update draft scores"
    on competition_scores for update
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or exists (
        select 1 from competition_judges cj
        where cj.id = competition_scores.judge_id
          and cj.user_id = auth.uid()
          and cj.status = 'active'
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition results
do $$ begin
  create policy "Published results are viewable"
    on competition_results for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or is_competition_judge(competition_id)
      or (
        status = 'published'
        and can_view_competition(competition_id)
      )
      or exists (
        select 1 from competition_participants cp
        where cp.id = competition_results.participant_id
          and cp.student_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage results"
    on competition_results for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition certificates
do $$ begin
  create policy "Recipients and organizers can view certificates"
    on competition_certificates for select
    using (
      is_admin()
      or recipient_id = auth.uid()
      or can_manage_competition(competition_id)
      or (status = 'issued' and qr_code_token is not null)
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage certificates"
    on competition_certificates for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;

-- Competition rankings
do $$ begin
  create policy "Public can view rankings"
    on competition_rankings for select
    using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admin and organizers can manage rankings"
    on competition_rankings for all
    using (
      is_admin()
      or (
        competition_id is not null
        and can_manage_competition(competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

-- Competition announcements
do $$ begin
  create policy "Audience can view published announcements"
    on competition_announcements for select
    using (
      is_admin()
      or can_manage_competition(competition_id)
      or (
        status = 'published'
        and can_view_competition(competition_id)
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage announcements"
    on competition_announcements for all
    using (can_manage_competition(competition_id) or is_admin());
exception when duplicate_object then null;
end $$;
