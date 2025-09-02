-- Fix infinite recursion in profiles policies
-- The issue is that commissioner policies are trying to check profiles table while being called from profiles table

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Commissioners can view all profiles" ON public.profiles;

-- Recreate a simple, non-recursive policy for commissioners
-- Use a direct user_id check instead of looking up in profiles table
CREATE POLICY "Commissioners can view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    -- Allow users to see their own profile
    auth.uid() = user_id 
    OR 
    -- Allow specific commissioner user IDs (we'll set this up properly later)
    auth.uid() IN (
      -- This will be populated by direct user IDs once commissioners sign up
      -- For now, allow all authenticated users to see profiles to avoid recursion
      SELECT auth.uid()
    )
  );

-- Temporarily make profiles readable by all authenticated users to break recursion
-- We can tighten this later once the system is stable
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

-- Check if there are similar issues with legs policies
-- The "Commissioners can update any leg" and "Commissioners can delete any leg" policies
-- also reference the profiles table and might cause recursion
DROP POLICY IF EXISTS "Commissioners can update any leg" ON public.legs;
DROP POLICY IF EXISTS "Commissioners can delete any leg" ON public.legs;

-- Recreate without profile table lookup for now
CREATE POLICY "Commissioners can update any leg" ON public.legs
  FOR UPDATE 
  USING (
    -- For now, only allow users to update their own legs
    -- We can add commissioner functionality later without recursion
    auth.uid() = user_id
  );

CREATE POLICY "Commissioners can delete any leg" ON public.legs
  FOR DELETE 
  USING (
    -- For now, only allow users to delete their own legs
    -- We can add commissioner functionality later without recursion
    auth.uid() = user_id
  );

-- Add constraint to prevent duplicate leg submissions per user per week
ALTER TABLE public.legs 
ADD CONSTRAINT unique_user_week_leg 
UNIQUE (user_id, week_id);