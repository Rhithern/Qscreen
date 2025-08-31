-- Add missing columns to existing tables
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed'));

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create evaluations table
CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES responses(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  score integer CHECK (score >= 0 AND score <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(response_id, reviewer_id)
);

-- Create comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create audit_log table
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_evaluations_response_id ON evaluations(response_id);
CREATE INDEX idx_evaluations_reviewer_id ON evaluations(reviewer_id);
CREATE INDEX idx_comments_interview_id ON comments(interview_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_questions_position ON questions(interview_id, position);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Evaluations: HR can CRUD their own evaluations, employers can read all in tenant
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_hr_crud" ON evaluations
  FOR ALL USING (
    reviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN responses r ON r.id = evaluations.response_id
      JOIN sessions s ON s.id = r.session_id
      JOIN interviews i ON i.id = s.interview_id
      WHERE tm.user_id = auth.uid() 
      AND tm.tenant_id = i.tenant_id 
      AND tm.role = 'employer'
    )
  );

-- Comments: tenant members can read/write comments for their tenant's interviews
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_tenant_access" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN interviews i ON i.id = comments.interview_id
      WHERE tm.user_id = auth.uid() 
      AND tm.tenant_id = i.tenant_id
    )
  );

-- Audit log: authenticated users can insert, tenant members can read their tenant's logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (
    actor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('employer', 'hr')
    )
  );

-- Update existing RLS policies for better role separation

-- Interviews: employers full access, HR read assigned only
DROP POLICY IF EXISTS "interviews_tenant_access" ON interviews;

CREATE POLICY "interviews_employer_access" ON interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.tenant_id = interviews.tenant_id 
      AND tm.role = 'employer'
    )
  );

CREATE POLICY "interviews_hr_read" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN assignments a ON a.interview_id = interviews.id
      WHERE tm.user_id = auth.uid() 
      AND tm.tenant_id = interviews.tenant_id 
      AND tm.role = 'hr'
      AND a.reviewer_id = auth.uid()
    )
  );

-- Questions: employers full access, HR/candidates read only for assigned/invited interviews
DROP POLICY IF EXISTS "questions_tenant_access" ON questions;

CREATE POLICY "questions_employer_access" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN interviews i ON i.id = questions.interview_id
      WHERE tm.user_id = auth.uid() 
      AND tm.tenant_id = i.tenant_id 
      AND tm.role = 'employer'
    )
  );

CREATE POLICY "questions_hr_read" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN interviews i ON i.id = questions.interview_id
      WHERE a.reviewer_id = auth.uid() 
      AND a.interview_id = questions.interview_id
    )
  );

CREATE POLICY "questions_candidate_read" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.candidate_id = auth.uid() 
      AND s.interview_id = questions.interview_id
    )
  );

-- Responses: candidates own their responses, HR/employers can read in their scope
DROP POLICY IF EXISTS "responses_user_access" ON responses;

CREATE POLICY "responses_candidate_access" ON responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = responses.session_id 
      AND s.candidate_id = auth.uid()
    )
  );

CREATE POLICY "responses_hr_read" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN sessions s ON s.interview_id = a.interview_id
      WHERE a.reviewer_id = auth.uid() 
      AND s.id = responses.session_id
    )
  );

CREATE POLICY "responses_employer_read" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN sessions s ON s.interview_id IN (
        SELECT id FROM interviews WHERE tenant_id = tm.tenant_id
      )
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'employer'
      AND s.id = responses.session_id
    )
  );
