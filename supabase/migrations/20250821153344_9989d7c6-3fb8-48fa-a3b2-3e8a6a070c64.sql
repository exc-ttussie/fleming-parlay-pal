-- Create a view for safe profile data (no email exposed)
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  user_id,
  name,
  team_name
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.safe_profiles TO authenticated;