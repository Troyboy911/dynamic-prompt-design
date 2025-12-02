import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, ShoppingCart, Zap, Globe, TrendingUp, Sparkles } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  features: any;
  is_premium: boolean;
}

interface Scraper {
  id: string;
  name: string;
  description: string;
  price_per_use: number;
  is_premium: boolean;
  category: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  price_per_use: number;
  is_premium: boolean;
  category: string;
}

const Marketplace = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      const [tiersRes, scrapersRes, automationsRes] = await Promise.all([
        supabase.from('pricing_tiers').select('*').order('price_monthly'),
        supabase.from('scrapers').select('*').eq('status', 'active').order('is_premium', { ascending: false }),
        supabase.from('automations').select('*').eq('status', 'active').order('is_premium', { ascending: false })
      ]);

      if (tiersRes.data) setPricingTiers(tiersRes.data);
      if (scrapersRes.data) setScrapers(scrapersRes.data);
      if (automationsRes.data) setAutomations(automationsRes.data);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    setProcessingPayment(tierId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
        return;
      }

      // Create Stripe checkout session - price fetched from database
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: tierId, 
          type: 'subscription'
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePurchase = async (itemType: 'scraper' | 'automation', itemId: string) => {
    setProcessingPayment(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
        return;
      }

      // Create one-time payment - price fetched from database
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          itemType,
          itemId,
          type: 'one_time'
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Stellarc Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful automation tools and web scrapers to supercharge your workflow
          </p>
        </div>

        <Tabs defaultValue="pricing" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
            <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
            <TabsTrigger value="automations">Automations</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {pricingTiers.map((tier) => (
                <Card key={tier.id} className={`relative ${tier.is_premium ? 'border-primary shadow-lg' : ''}`}>
                  {tier.is_premium && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-primary/60">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">
                      ${tier.price_monthly}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(tier.features || {}).map(([key, value]) => (
                        <li key={key} className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-primary" />
                          {key.replace(/_/g, ' ')}: {String(value)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={processingPayment === tier.id}
                    >
                      {processingPayment === tier.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Subscribe Now'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scrapers" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scrapers.map((scraper) => (
                <Card key={scraper.id} className={scraper.is_premium ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Globe className="h-8 w-8 text-primary" />
                      {scraper.is_premium && (
                        <Badge variant="secondary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{scraper.name}</CardTitle>
                    <CardDescription>{scraper.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      ${scraper.price_per_use}
                      <span className="text-sm font-normal text-muted-foreground">/use</span>
                    </div>
                    <Badge className="mt-2" variant="outline">{scraper.category}</Badge>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase('scraper', scraper.id)}
                      disabled={processingPayment === scraper.id}
                    >
                      {processingPayment === scraper.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automations" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automations.map((automation) => (
                <Card key={automation.id} className={automation.is_premium ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Zap className="h-8 w-8 text-primary" />
                      {automation.is_premium && (
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{automation.name}</CardTitle>
                    <CardDescription>{automation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      ${automation.price_per_use}
                      <span className="text-sm font-normal text-muted-foreground">/use</span>
                    </div>
                    <Badge className="mt-2" variant="outline">{automation.category}</Badge>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase('automation', automation.id)}
                      disabled={processingPayment === automation.id}
                    >
                      {processingPayment === automation.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;