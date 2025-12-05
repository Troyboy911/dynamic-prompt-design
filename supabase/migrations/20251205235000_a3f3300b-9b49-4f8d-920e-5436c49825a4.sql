-- Fix 1: profiles table - Remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Users can only view their own profile (already exists, but ensuring it's correct)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile (already exists)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: email_logs table - Remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;

-- Create proper admin-only insert policy for automated processes
DROP POLICY IF EXISTS "Admins can insert email logs" ON public.email_logs;
CREATE POLICY "Admins can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 3: email_templates - Restrict to admins only (remove public access)
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.email_templates;

-- Only admins can view templates
DROP POLICY IF EXISTS "Admins can view templates" ON public.email_templates;
CREATE POLICY "Admins can view templates" 
ON public.email_templates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));