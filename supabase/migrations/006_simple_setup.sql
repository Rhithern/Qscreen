-- Simple setup script - run this first to drop all policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies on all tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('jobs', 'question_bank', 'job_questions', 'invites', 'sessions', 'responses', 'audit_log')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Update profiles table to support new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'admin', 'recruiter', 'reviewer', 'candidate'));

-- Add tenant_id to profiles for candidates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Update tenant_members role structure
ALTER TABLE tenant_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
ALTER TABLE tenant_members ADD CONSTRAINT tenant_members_role_check 
  CHECK (role IN ('owner', 'admin', 'recruiter', 'reviewer'));

-- Create all required tables
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  jd TEXT,
  competencies JSONB DEFAULT '[]',
  due_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('draft', 'live', 'closed')) DEFAULT 'draft',
  brand JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  time_limit_sec INTEGER DEFAULT 120,
  ideal_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  time_limit_sec INTEGER DEFAULT 120,
  ideal_answer TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  reminders JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'submitted')) DEFAULT 'not_started',
  current_index INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES job_questions(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  duration_sec INTEGER,
  score NUMERIC(3,1),
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_question_bank_tenant_id ON question_bank(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_questions_job_id ON job_questions(job_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_job_id ON invites(job_id);
CREATE INDEX IF NOT EXISTS idx_sessions_job_id ON sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_sessions_candidate_id ON sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Create accept_invite function
CREATE OR REPLACE FUNCTION accept_invite(invite_token UUID)
RETURNS JSONB AS $$
DECLARE
  invite_record RECORD;
  user_id UUID;
  session_record RECORD;
BEGIN
  SELECT * INTO invite_record 
  FROM invites 
  WHERE token = invite_token 
    AND NOT used 
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invite');
  END IF;
  
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  UPDATE profiles 
  SET role = 'candidate', 
      tenant_id = (SELECT tenant_id FROM jobs WHERE id = invite_record.job_id)
  WHERE id = user_id;
  
  UPDATE invites SET used = TRUE WHERE id = invite_record.id;
  
  SELECT * INTO session_record 
  FROM sessions 
  WHERE job_id = invite_record.job_id AND candidate_id = user_id;
  
  IF NOT FOUND THEN
    INSERT INTO sessions (job_id, candidate_id, status)
    VALUES (invite_record.job_id, user_id, 'not_started')
    RETURNING * INTO session_record;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', invite_record.job_id,
    'session_id', session_record.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
