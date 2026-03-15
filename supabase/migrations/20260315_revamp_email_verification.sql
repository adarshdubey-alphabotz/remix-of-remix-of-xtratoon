-- Revamp email verification to use Supabase native email confirmation
-- This migration updates the system to leverage Supabase Auth's email_confirmed field

-- 1. Add email_verified tracking to profiles table if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Update profiles for existing users based on Supabase auth.users email_confirmed_at
UPDATE profiles p
SET email_verified_at = (
  SELECT email_confirmed_at 
  FROM auth.users u 
  WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL
)
WHERE email_verified_at IS NULL;

-- 3. Mark all users with confirmed emails as verified
UPDATE profiles p
SET email_verified_at = NOW()
WHERE email_verified_at IS NULL 
AND id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- 4. Keep pending_verifications table for backward compatibility but deprecate it
-- New signups will use Supabase Auth's built-in email confirmation
ALTER TABLE pending_verifications
ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT FALSE;

-- 5. Create an index on email_verified_at for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified_at 
ON profiles(email_verified_at);

-- 6. Add check constraint to ensure only unverified users can exist in pending_verifications
-- This helps maintain data integrity
ALTER TABLE pending_verifications
ADD CONSTRAINT check_unverified_only 
CHECK (verified = false) NOT DEFERRABLE;
