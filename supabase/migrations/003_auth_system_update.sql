-- Update auth system for employer/candidate flow
-- This migration updates the existing schema to support the new auth requirements

-- Update profiles table to support new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'admin', 'recruiter', 'reviewer', 'candidate'));

-- Add tenant_id to profiles for candidates (nullable, set when they accept invite)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Update tenant_members to use new role structure
ALTER TABLE tenant_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
ALTER TABLE tenant_members ADD CONSTRAINT tenant_members_role_check 
  CHECK (role IN ('owner', 'admin', 'recruiter', 'reviewer'));

-- Create jobs table (rename from interviews)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  jd TEXT, -- job description
  competencies JSONB DEFAULT '[]',
  due_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('draft', 'live', 'closed')) DEFAULT 'draft',
  brand JSONB DEFAULT '{}', -- logo/colors for this job
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question_bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  time_limit_sec INTEGER DEFAULT 120,
  ideal_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_questions table (replaces interview_questions)
CREATE TABLE IF NOT EXISTS job_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  time_limit_sec INTEGER DEFAULT 120,
  ideal_answer TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invites table (replaces invitations)
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

-- Create sessions table (replaces interview_sessions)
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

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES job_questions(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  duration_sec INTEGER,
  score NUMERIC(3,1), -- 0.0 to 10.0
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
CREATE POLICY "Tenant members can view jobs in their tenant" ON jobs
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can create jobs in their tenant" ON jobs
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter')
      )
    )
  );

CREATE POLICY "Job creators can update their jobs" ON jobs
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter')
      )
    )
  );

-- RLS Policies for question_bank
CREATE POLICY "Tenant members can view question bank" ON question_bank
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can manage question bank" ON question_bank
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter')
      )
    )
  );

-- RLS Policies for job_questions
CREATE POLICY "Tenant members can view job questions" ON job_questions
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Candidates can view questions for their assigned job" ON job_questions
  FOR SELECT USING (
    job_id IN (
      SELECT job_id FROM sessions WHERE candidate_id = auth.uid()
    )
  );

CREATE POLICY "Employers can manage job questions" ON job_questions
  FOR ALL USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members 
        WHERE user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter')
        )
      )
    )
  );

-- RLS Policies for invites
CREATE POLICY "Tenant members can view invites" ON invites
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Employers can manage invites" ON invites
  FOR ALL USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members 
        WHERE user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter')
        )
      )
    )
  );

-- RLS Policies for sessions
CREATE POLICY "Candidates can view their own sessions" ON sessions
  FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can update their own sessions" ON sessions
  FOR UPDATE USING (candidate_id = auth.uid());

CREATE POLICY "Tenant members can view sessions for jobs in their tenant" ON sessions
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for responses
CREATE POLICY "Candidates can manage their own responses" ON responses
  FOR ALL USING (
    session_id IN (
      SELECT id FROM sessions WHERE candidate_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can view responses for jobs in their tenant" ON responses
  FOR SELECT USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN jobs j ON s.job_id = j.id
      WHERE j.tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Reviewers can score responses" ON responses
  FOR UPDATE USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN jobs j ON s.job_id = j.id
      WHERE j.tenant_id IN (
        SELECT tenant_id FROM tenant_members 
        WHERE user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'recruiter', 'reviewer')
        )
      )
    )
  );

-- RLS Policies for audit_log
CREATE POLICY "Tenant admins can view audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN profiles p ON tm.user_id = p.id
      WHERE tm.user_id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );

-- Create indexes for performance
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

-- Update triggers for new tables
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle invite acceptance and candidate creation
CREATE OR REPLACE FUNCTION accept_invite(invite_token UUID)
RETURNS JSONB AS $$
DECLARE
  invite_record RECORD;
  user_id UUID;
  session_record RECORD;
BEGIN
  -- Check if invite exists and is valid
  SELECT * INTO invite_record 
  FROM invites 
  WHERE token = invite_token 
    AND NOT used 
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invite');
  END IF;
  
  -- Get current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Update profile to candidate role and set tenant
  UPDATE profiles 
  SET role = 'candidate', 
      tenant_id = (SELECT tenant_id FROM jobs WHERE id = invite_record.job_id)
  WHERE id = user_id;
  
  -- Mark invite as used
  UPDATE invites SET used = TRUE WHERE id = invite_record.id;
  
  -- Create or get session
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
