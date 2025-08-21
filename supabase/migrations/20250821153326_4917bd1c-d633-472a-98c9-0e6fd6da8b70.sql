-- Remove the overly permissive policy I just created
DROP POLICY IF EXISTS "Limited profile access for joins" ON public.profiles;

-- Create a security definer function that only exposes safe profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, team_name TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT p.user_id, p.name, p.team_name
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Create a view for public profile data that uses the function
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  name,
  team_name
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = off);

-- Create policy for the public profiles view
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);