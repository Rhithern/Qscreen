-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('employer', 'hr', 'candidate')) DEFAULT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  theme JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenant_members table
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Create tenant_domains table for custom domains
CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  candidate_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transcript JSONB DEFAULT '[]',
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for tenants
CREATE POLICY "Tenant members can view their tenant" ON tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can update their tenant" ON tenants
  FOR UPDATE USING (
    id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for tenant_members
CREATE POLICY "Tenant members can view members of their tenant" ON tenant_members
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can manage members" ON tenant_members
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for interviews
CREATE POLICY "Tenant members can view interviews in their tenant" ON interviews
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can create interviews in their tenant" ON interviews
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('employer', 'hr')
      )
    )
  );

CREATE POLICY "Interview creators can update their interviews" ON interviews
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for interview_questions
CREATE POLICY "Tenant members can view questions for interviews in their tenant" ON interview_questions
  FOR SELECT USING (
    interview_id IN (
      SELECT id FROM interviews WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Interview creators can manage questions" ON interview_questions
  FOR ALL USING (
    interview_id IN (
      SELECT id FROM interviews WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Tenant members can view invitations for interviews in their tenant" ON invitations
  FOR SELECT USING (
    interview_id IN (
      SELECT id FROM interviews WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Interview creators can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    interview_id IN (
      SELECT id FROM interviews WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for interview_sessions
CREATE POLICY "Candidates can view their own sessions" ON interview_sessions
  FOR SELECT USING (candidate_id = auth.uid());

CREATE POLICY "Tenant members can view sessions for interviews in their tenant" ON interview_sessions
  FOR SELECT USING (
    interview_id IN (
      SELECT id FROM interviews WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Candidates can update their own sessions" ON interview_sessions
  FOR UPDATE USING (candidate_id = auth.uid());

CREATE POLICY "HR can update sessions in their tenant" ON interview_sessions
  FOR UPDATE USING (
    interview_id IN (
      SELECT id FROM interviews WHERE tenant_id IN (
        SELECT tenant_id FROM tenant_members 
        WHERE user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('employer', 'hr')
        )
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX idx_interviews_tenant_id ON interviews(tenant_id);
CREATE INDEX idx_interviews_created_by ON interviews(created_by);
CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_interview_id ON invitations(interview_id);
CREATE INDEX idx_interview_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON interview_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
