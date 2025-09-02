-- Phase 1: Secure safe_profiles table
-- Currently safe_profiles has no RLS policies, making it publicly readable

-- Enable Row Level Security on safe_profiles
ALTER TABLE public.safe_profiles ENABLE ROW LEVEL SECURITY;

-- Add policy to allow authenticated users to view public profile data only
-- This ensures safe_profiles data is only accessible to authenticated users
CREATE POLICY "Safe profiles viewable by authenticated users" 
ON public.safe_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');