-- Create automation_logs table for AI agent execution tracking
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'error')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  model_used TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create file_metadata table for storage tracking
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  bucket_id TEXT DEFAULT 'agent-files',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Create security definer function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id
    AND email IN ('admin@stellarc.com', 'admin@example.com')
  );
$$;

-- RLS Policies for automation_logs
CREATE POLICY "Users can view their own logs"
  ON public.automation_logs
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own logs"
  ON public.automation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for file_metadata
CREATE POLICY "Users can view their own files"
  ON public.file_metadata
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own files"
  ON public.file_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own files"
  ON public.file_metadata
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automation_logs
CREATE TRIGGER update_automation_logs_updated_at
  BEFORE UPDATE ON public.automation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for agent files
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-files', 'agent-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agent-files bucket
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-files' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'agent-files'
    AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'agent-files'
    AND auth.uid() = owner
  );