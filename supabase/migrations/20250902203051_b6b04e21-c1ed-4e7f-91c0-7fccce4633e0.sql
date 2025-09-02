-- Fix security vulnerability: Remove overly permissive profile access policy
-- The "Limited profile access for joins" policy allows any authenticated user 
-- to access all profile data including email addresses, which is a security risk.

-- Drop the problematic policy that exposes email addresses
DROP POLICY IF EXISTS "Limited profile access for joins" ON public.profiles;

-- The existing safe_profiles view already provides secure access to public profile data
-- and the application code is already using it. The remaining policies on profiles are:
-- 1. "Users can view own profile" - allows users to see their own profile
-- 2. "Commissioners can view all profiles" - allows commissioners to manage users
-- 3. "Users can insert their own profile" - allows profile creation
-- 4. "Users can update their own profile" - allows profile updates

-- This ensures email addresses are only accessible to:
-- - The profile owner themselves
-- - Commissioners for administrative purposes
-- All other code should use the safe_profiles view for public profile data