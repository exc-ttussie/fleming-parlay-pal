-- Recreate the view as security invoker to fix the security warning
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  name,
  team_name
FROM public.profiles;