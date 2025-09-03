-- Remove the overly permissive policy that exposes email addresses to all users
DROP POLICY IF EXISTS "Safe profiles are viewable by authenticated users" ON public.profiles;

-- The existing policies already provide proper access:
-- 1. "Users can view own profile" - users can see their own data
-- 2. "Commissioners can view all profiles" - commissioners have admin access
-- 3. The safe_profiles table/view is used for public profile data without emails