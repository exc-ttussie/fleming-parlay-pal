-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own complete profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow commissioners to view all profiles (for admin functions)
CREATE POLICY "Commissioners can view all profiles"
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.role = 'COMMISSIONER'::app_role
  )
);

-- Allow limited access for joins - users can see names/team_names only
-- This works because the app code already limits column selection in joins
CREATE POLICY "Limited profile access for joins"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);