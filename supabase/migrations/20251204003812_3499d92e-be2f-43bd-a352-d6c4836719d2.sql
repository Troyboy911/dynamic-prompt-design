-- Create profiles table for user journey tracking
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  converted_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  email_sequence_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON public.profiles
FOR ALL USING (true) WITH CHECK (true);

-- Create email_logs table for tracking
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_logs
CREATE POLICY "Admins can view all email logs" ON public.email_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage email logs" ON public.email_logs
FOR ALL USING (true) WITH CHECK (true);

-- Create email_templates table (admin editable)
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  trigger_day INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "Anyone can view active templates" ON public.email_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.email_templates
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Insert default email templates for the 7-day sequence
INSERT INTO public.email_templates (name, subject, html_content, trigger_day, is_active) VALUES
('welcome', 'Welcome to Stellarc Dynamics - Your AI Journey Begins! 🚀', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #00d4ff; margin: 0;">Welcome to Stellarc Dynamics</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #00d4ff33;"><p>Hi {{name}},</p><p>Welcome aboard! You''ve just unlocked access to the most powerful AI automation platform on the market.</p><p><strong>Your 7-day free trial includes:</strong></p><ul><li>Access to our AI agents and automations</li><li>One free mid-tier tool to test</li><li>Full marketplace access</li></ul><p>Your trial ends on <strong>{{trial_end_date}}</strong>.</p><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0066cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Explore the Marketplace</a><p>Need help getting started? Reply to this email!</p><p>Best,<br>The Stellarc Dynamics Team</p></div></body></html>', 0, true),
('day_2_features', 'Discover Your New Superpowers 💪', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #00d4ff; margin: 0;">Your AI Arsenal Awaits</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #00d4ff33;"><p>Hi {{name}},</p><p>Have you explored what Stellarc can do for you yet?</p><p><strong>Top 3 automations our users love:</strong></p><ol><li><strong>Report Generation</strong> - Automated insights in minutes</li><li><strong>Email Automation</strong> - Never miss a follow-up</li><li><strong>Data Processing</strong> - Handle massive datasets effortlessly</li></ol><p>Each one is designed to save you hours of work every week.</p><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0066cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Try a Tool Now</a><p>5 days left in your trial!</p></div></body></html>', 2, true),
('day_4_social_proof', 'See What Others Are Achieving 📈', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #00d4ff; margin: 0;">Real Results from Real Users</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #00d4ff33;"><p>Hi {{name}},</p><p>Our users are seeing incredible results:</p><div style="background: #0a0a0f; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 3px solid #00d4ff;"><p><em>"Stellarc''s automations saved me 15+ hours per week. The ROI was immediate."</em></p><p style="color: #888;">- Marketing Director, Tech Startup</p></div><div style="background: #0a0a0f; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 3px solid #00d4ff;"><p><em>"The AI agents handle tasks that used to require a whole team."</em></p><p style="color: #888;">- CEO, E-commerce Brand</p></div><p>You have 3 days left to experience this yourself!</p><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0066cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Start Automating Today</a></div></body></html>', 4, true),
('day_5_urgency', '⏰ Only 2 Days Left in Your Trial', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #ffb000; margin: 0;">Time is Running Out!</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #ffb00033;"><p>Hi {{name}},</p><p>Your free trial ends in just <strong>2 days</strong>.</p><p>Don''t lose access to:</p><ul><li>AI-powered automations</li><li>Professional scrapers</li><li>Elite Dominus Lab tools</li><li>24/7 AI support</li></ul><p><strong>Upgrade now and lock in our best pricing:</strong></p><ul><li>Starter: $25.49/month</li><li>Professional: $67.99/month</li><li>Premium: $169.99/month</li></ul><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #ffb000, #ff6600); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Upgrade Now</a></div></body></html>', 5, true),
('day_6_last_chance', '🎁 EXCLUSIVE: 20% Off - Last Chance!', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #ef4444; margin: 0;">Final Hours - Special Offer Inside</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #ef444433;"><p>Hi {{name}},</p><p>Your trial expires <strong>TOMORROW</strong>.</p><p>As a thank you for trying Stellarc, here''s an exclusive offer:</p><div style="background: linear-gradient(135deg, #00d4ff22, #0066cc22); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;"><h2 style="color: #00d4ff; margin: 0;">20% OFF</h2><p style="margin: 10px 0;">Any subscription plan</p><p style="font-size: 24px; font-weight: bold; color: #ffb000;">Code: STELLARC20</p></div><p>This code expires when your trial does. Don''t miss out!</p><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Claim Your Discount</a></div></body></html>', 6, true),
('trial_expired', 'We Miss You! Here''s a Special Offer 💫', '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;"><div style="text-align: center; padding: 20px 0;"><h1 style="color: #00d4ff; margin: 0;">Come Back to Stellarc</h1></div><div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #00d4ff33;"><p>Hi {{name}},</p><p>Your trial has ended, but your journey doesn''t have to.</p><p>We''ve reserved a special comeback offer just for you:</p><div style="background: linear-gradient(135deg, #00d4ff22, #0066cc22); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;"><h2 style="color: #00d4ff; margin: 0;">25% OFF</h2><p style="margin: 10px 0;">Your first 3 months</p><p style="font-size: 24px; font-weight: bold; color: #ffb000;">Code: COMEBACK25</p></div><p>Ready to unlock your AI potential?</p><a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0066cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reactivate Your Account</a></div></body></html>', 8, true);