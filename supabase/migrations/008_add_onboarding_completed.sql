-- Add onboarding_completed field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing employer profiles to completed (they must have already onboarded)
UPDATE profiles 
SET onboarding_completed = TRUE 
WHERE role IN ('owner', 'admin', 'recruiter', 'reviewer') 
  AND onboarding_completed = FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
