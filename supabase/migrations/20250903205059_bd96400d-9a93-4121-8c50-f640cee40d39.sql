-- Add RLS policy to allow commissioners to view all legs
CREATE POLICY "Commissioners can view all legs" 
ON public.legs 
FOR SELECT 
USING (get_current_user_role() = 'COMMISSIONER');

-- Update the profiles SELECT policy to allow commissioners to view all profiles
DROP POLICY IF EXISTS "Commissioners can view all profiles" ON public.profiles;
CREATE POLICY "Commissioners can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (get_current_user_role() = 'COMMISSIONER')
);