-- SkillSwap database schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- profiles: one row per auth user, id matches auth.users.id
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  school text,
  department text,
  level text,
  bio text,
  availability jsonb default '{}'::jsonb,
  avatar_url text,
  student_id_url text,
  verification_status text default 'pending', -- pending | verified | rejected
  verified boolean default false,
  reputation_score numeric default 0,
  gamification_points integer default 0,
  rank text default 'Bronze Mentor',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- skills: each row is one thing a user offers OR wants
-- ─────────────────────────────────────────────────────────────
create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  skill_name text not null,
  category text,
  direction text not null check (direction in ('offered', 'wanted')),
  proficiency_level text, -- e.g. beginner | intermediate | advanced
  created_at timestamptz default now()
);

create index idx_skills_user_id on skills(user_id);
create index idx_skills_skill_name on skills(skill_name);

-- ─────────────────────────────────────────────────────────────
-- matches: a reciprocal skill-swap connection between two users
-- ─────────────────────────────────────────────────────────────
create table matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  user1_teaches text not null,
  user2_teaches text not null,
  status text default 'pending', -- pending | accepted | active | completed | cancelled
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_matches_user1 on matches(user1_id);
create index idx_matches_user2 on matches(user2_id);

-- ─────────────────────────────────────────────────────────────
-- messages: chat history per match
-- ─────────────────────────────────────────────────────────────
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  message_type text default 'text',
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_messages_match_id on messages(match_id);

-- ─────────────────────────────────────────────────────────────
-- sessions: scheduled meetings tied to a match
-- ─────────────────────────────────────────────────────────────
create table sessions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  duration_minutes integer default 60,
  session_type text default 'text', -- text | video
  status text default 'scheduled', -- scheduled | completed | cancelled
  room_url text,
  created_at timestamptz default now()
);

create index idx_sessions_match_id on sessions(match_id);

-- ─────────────────────────────────────────────────────────────
-- reviews: post-session feedback, feeds reputation_score
-- ─────────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewee_id uuid references profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  was_respectful boolean,
  did_show_up boolean,
  would_swap_again boolean,
  comment text,
  created_at timestamptz default now(),
  unique (session_id, reviewer_id)
);

create index idx_reviews_reviewee on reviews(reviewee_id);

-- ─────────────────────────────────────────────────────────────
-- notifications: in-app alerts (session reminders, review prompts, etc.)
-- ─────────────────────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null, -- session_reminder | review_prompt | match_request | admin_notice ...
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on notifications(user_id);

-- ─────────────────────────────────────────────────────────────
-- reports: user-submitted flags for moderation (admin queue)
-- ─────────────────────────────────────────────────────────────
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_user_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  details text,
  status text default 'open', -- open | reviewed | dismissed
  created_at timestamptz default now()
);

create index idx_reports_status on reports(status);

-- ─────────────────────────────────────────────────────────────
-- Storage buckets (avatars, student IDs) — create via Dashboard ->
-- Storage -> New bucket, named exactly "avatars" and "student-ids".
-- Set both to public if you want getPublicUrl() to work as written,
-- or private + signed URLs if you want tighter access control later.
-- ─────────────────────────────────────────────────────────────
