-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('employer','hr','candidate')) not null,
  company text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- interviews
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  jitsi_room text,
  status text check (status in ('draft','open','closed')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.interviews enable row level security;

-- questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  prompt text not null,
  reference_answer text,
  tts_voice_id text,
  position int not null default 0
);
alter table public.questions enable row level security;

-- invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  candidate_email text not null,
  token uuid not null default gen_random_uuid(),
  used boolean default false,
  created_at timestamptz default now()
);
alter table public.invitations enable row level security;

-- assignments (which HRs can review which interviews)
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  hr_id uuid not null references auth.users(id) on delete cascade
);
alter table public.assignments enable row level security;

-- sessions (candidate's active interview)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  current_question_index int default 0,
  running_score numeric default 0,
  status text check (status in ('in_progress','completed')) default 'in_progress',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.sessions enable row level security;

-- responses (per-question results)
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  audio_url text,
  transcript text,
  score numeric,
  ai_feedback text,
  created_at timestamptz default now()
);
alter table public.responses enable row level security;

-- RLS policies
-- Profiles: each user sees/updates their own
create policy "profiles_self" on public.profiles
for select using (auth.uid() = id);
create policy "profiles_self_upd" on public.profiles
for update using (auth.uid() = id);

-- Employers: own interviews
create policy "interviews_employer_rw" on public.interviews
for all using (employer_id = auth.uid()) with check (employer_id = auth.uid());

-- HR: read interviews they're assigned to
create policy "interviews_hr_read" on public.interviews
for select using (exists (
  select 1 from public.assignments a
  where a.interview_id = interviews.id and a.hr_id = auth.uid()
));

-- Questions: employer (owner) rw; hr read; candidates read only for their session
create policy "questions_employer_rw" on public.questions
for all using (
  exists (select 1 from public.interviews i where i.id = questions.interview_id and i.employer_id = auth.uid())
) with check (
  exists (select 1 from public.interviews i where i.id = questions.interview_id and i.employer_id = auth.uid())
);
create policy "questions_hr_read" on public.questions
for select using (
  exists (select 1 from public.assignments a join public.interviews i on a.interview_id=i.id where i.id = questions.interview_id and a.hr_id = auth.uid())
);
create policy "questions_candidate_read" on public.questions
for select using (
  exists (select 1 from public.sessions s where s.interview_id = questions.interview_id and s.candidate_id = auth.uid())
);

-- Invitations: employer rw; nobody else
create policy "invitations_employer_rw" on public.invitations
for all using (
  exists (select 1 from public.interviews i where i.id = invitations.interview_id and i.employer_id = auth.uid())
) with check (
  exists (select 1 from public.interviews i where i.id = invitations.interview_id and i.employer_id = auth.uid())
);

-- Assignments: employer rw; hr read their own
create policy "assignments_employer_rw" on public.assignments
for all using (
  exists (select 1 from public.interviews i where i.id = assignments.interview_id and i.employer_id = auth.uid())
) with check (
  exists (select 1 from public.interviews i where i.id = assignments.interview_id and i.employer_id = auth.uid())
);
create policy "assignments_hr_read_self" on public.assignments
for select using (hr_id = auth.uid());

-- Sessions: candidate rw own, employer/hr read for their interviews
create policy "sessions_candidate_rw" on public.sessions
for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "sessions_employer_read" on public.sessions
for select using (
  exists (select 1 from public.interviews i where i.id = sessions.interview_id and i.employer_id = auth.uid())
);
create policy "sessions_hr_read" on public.sessions
for select using (
  exists (select 1 from public.assignments a where a.interview_id = sessions.interview_id and a.hr_id = auth.uid())
);

-- Responses: candidate rw own; employer/hr read for their interviews
create policy "responses_candidate_rw" on public.responses
for all using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "responses_employer_read" on public.responses
for select using (
  exists (select 1 from public.interviews i where i.id = responses.interview_id and i.employer_id = auth.uid())
);
create policy "responses_hr_read" on public.responses
for select using (
  exists (select 1 from public.assignments a where a.interview_id = responses.interview_id and a.hr_id = auth.uid())
);


