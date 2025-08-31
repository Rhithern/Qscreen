-- Working seed data - handles NOT NULL constraints
-- Run this in Supabase SQL Editor

-- Insert demo tenant
INSERT INTO tenants (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Company')
ON CONFLICT (id) DO NOTHING;

-- First, let's modify the jobs table to make created_by nullable temporarily
ALTER TABLE jobs ALTER COLUMN created_by DROP NOT NULL;

-- Create demo job
INSERT INTO jobs (id, tenant_id, title, location, jd, competencies, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Frontend Developer',
  'Remote',
  'We are looking for a skilled Frontend Developer to join our team.',
  '["JavaScript", "React", "TypeScript"]'::jsonb,
  'live'
)
ON CONFLICT (id) DO NOTHING;

-- Create demo questions
INSERT INTO job_questions (job_id, text, position, time_limit_sec) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tell me about your experience with React', 1, 120),
('550e8400-e29b-41d4-a716-446655440001', 'How do you handle state management?', 2, 120),
('550e8400-e29b-41d4-a716-446655440001', 'Describe a challenging project you worked on', 3, 120)
ON CONFLICT DO NOTHING;

-- Create demo invite
INSERT INTO invites (job_id, email, name, token, expires_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'candidate@demo.com',
  'Demo Candidate',
  '550e8400-e29b-41d4-a716-446655440003',
  NOW() + INTERVAL '7 days'
)
ON CONFLICT (token) DO NOTHING;
