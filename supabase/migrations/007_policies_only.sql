-- Create RLS policies for all tables
-- Run this AFTER the main setup script

-- Jobs policies
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

-- Question bank policies
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

-- Job questions policies
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

-- Invites policies
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

-- Sessions policies
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

-- Responses policies
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

-- Audit log policies
CREATE POLICY "Tenant admins can view audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN profiles p ON tm.user_id = p.id
      WHERE tm.user_id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );
