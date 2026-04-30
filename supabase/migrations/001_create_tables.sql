-- Run these in Supabase SQL Editor

-- Table 1: user_profiles
CREATE TABLE user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  onboarding_completed boolean default false,
  voice_profile jsonb,
  proposals_today int default 0,
  last_proposal_date date,
  total_proposals int default 0,
  plan text default 'free',
  created_at timestamp default now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Table 2: proposals
CREATE TABLE proposals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  job_description text,
  user_skills text,
  user_experience text,
  match_score int,
  match_verdict text,
  strengths jsonb,
  gaps jsonb,
  improvement_tip text,
  client_pain_point text,
  key_signals jsonb,
  proposal_text text,
  created_at timestamp default now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own proposals"
  ON proposals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals"
  ON proposals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table 3: onboarding_samples
CREATE TABLE onboarding_samples (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  sample_text text,
  sample_number int,
  created_at timestamp default now()
);

ALTER TABLE onboarding_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own samples"
  ON onboarding_samples FOR ALL USING (auth.uid() = user_id);
