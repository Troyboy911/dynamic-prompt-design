-- Create pricing tiers table
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_per_use DECIMAL(10,2),
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  usage_limit_monthly INTEGER,
  is_premium BOOLEAN DEFAULT false,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pricing_tier_id UUID REFERENCES public.pricing_tiers(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user purchases table
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'scraper' or 'automation'
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add pricing fields to scrapers table
ALTER TABLE public.scrapers 
ADD COLUMN price_per_use DECIMAL(10,2) DEFAULT 5.00,
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN category TEXT DEFAULT 'web';

-- Add pricing fields to automations table
ALTER TABLE public.automations 
ADD COLUMN price_per_use DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN category TEXT DEFAULT 'general';

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for pricing_tiers (public read, admin write)
CREATE POLICY "Anyone can view pricing tiers" ON public.pricing_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing tiers" ON public.pricing_tiers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create policies for user_purchases
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Update scrapers policies to allow public read
DROP POLICY IF EXISTS "Admins can view all scrapers" ON public.scrapers;
CREATE POLICY "Anyone can view scrapers" ON public.scrapers
  FOR SELECT USING (true);

-- Update automations policies to allow public read
DROP POLICY IF EXISTS "Admins can view all automations" ON public.automations;
CREATE POLICY "Anyone can view automations" ON public.automations
  FOR SELECT USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();