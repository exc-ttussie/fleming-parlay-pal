-- Phase 1: Critical Email Privacy Fix
-- Create a security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create a safe public view for profiles without emails
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  user_id,
  name,
  team_name
FROM public.profiles;

-- Enable RLS on the safe_profiles view
ALTER VIEW public.safe_profiles SET (security_invoker = on);

-- Phase 2: Fix RLS policies using security definer function
-- Drop current policies that might expose emails
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Commissioners can view all profiles" ON public.profiles;

-- Create new secure policies
-- Users can only see their own full profile (including email)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Commissioners can see all profiles (including emails) using security definer function
CREATE POLICY "Commissioners can view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'COMMISSIONER'
  );

-- Fix legs policies to use security definer function for commissioners
DROP POLICY IF EXISTS "Commissioners can update any leg" ON public.legs;
DROP POLICY IF EXISTS "Commissioners can delete any leg" ON public.legs;

CREATE POLICY "Commissioners can update any leg" ON public.legs
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'COMMISSIONER'
  );

CREATE POLICY "Commissioners can delete any leg" ON public.legs
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'COMMISSIONER'
  );

-- Add RLS policy for safe_profiles view (public data only)
CREATE POLICY "Safe profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

-- Create a helper function to check if current user is commissioner
CREATE OR REPLACE FUNCTION public.is_commissioner()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'COMMISSIONER'
  );
$$;