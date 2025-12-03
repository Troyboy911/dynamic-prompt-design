import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, ShoppingCart, Zap, Globe, TrendingUp, Sparkles, CheckCircle, Lock, Crown, Skull } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import eliteVaultImage from '@/assets/elite-vault.jpg';

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
  config?: any;
}

const Marketplace = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [eliteAutomations, setEliteAutomations] = useState<Automation[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [isEliteMember, setIsEliteMember] = useState(false);
  const [vaultAnimating, setVaultAnimating] = useState(false);

  useEffect(() => {
    // Check for success/cancel from Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "🎉 Purchase Successful!",
        description: "Thank you for your purchase. Check your email for details.",
      });
    } else if (canceled === 'true') {
      toast({
        title: "Purchase Canceled",
        description: "Your payment was canceled. Feel free to try again.",
        variant: "destructive",
      });
    }
    
    fetchMarketplaceData();
    checkEliteStatus();
  }, [searchParams]);

  // Vault animation loop
  useEffect(() => {
    if (!isEliteMember) {
      const interval = setInterval(() => {
        setVaultAnimating(true);
        setTimeout(() => setVaultAnimating(false), 2000);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isEliteMember]);

  const checkEliteStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user has an active premium subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*, pricing_tiers(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.pricing_tiers?.is_premium) {
        setIsEliteMember(true);
      }
    } catch (error) {
      console.error('Error checking elite status:', error);
    }
  };

  const fetchMarketplaceData = async () => {
    try {
      const [tiersRes, scrapersRes, automationsRes] = await Promise.all([
        supabase.from('pricing_tiers').select('*').order('price_monthly'),
        supabase.from('scrapers').select('*').eq('status', 'active').order('is_premium', { ascending: false }),
        supabase.from('automations').select('*').eq('status', 'active').order('is_premium', { ascending: false })
      ]);

      if (tiersRes.data) setPricingTiers(tiersRes.data);
      if (scrapersRes.data) setScrapers(scrapersRes.data);
      if (automationsRes.data) {
        // Separate elite automations from regular ones
        const elite = automationsRes.data.filter(a => a.category === 'elite');
        const regular = automationsRes.data.filter(a => a.category !== 'elite');
        setEliteAutomations(elite);
        setAutomations(regular);
      }
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
        navigate('/auth?returnTo=/marketplace');
        return;
      }

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

  const handlePurchase = async (itemType: 'scraper' | 'automation', itemId: string, purchaseLicense: boolean = false) => {
    setProcessingPayment(itemId + (purchaseLicense ? '-license' : ''));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?returnTo=/marketplace');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          itemType,
          itemId,
          type: 'one_time',
          purchaseLicense
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        toast({
          title: "Rate Limit Reached",
          description: data.error,
          variant: "destructive"
        });
        return;
      }
      
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
      <div className="min-h-screen hero-bg">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-bg">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            15% Launch Discount Applied
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Stellarc Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful automation tools and web scrapers to supercharge your workflow
          </p>
        </div>

        <Tabs defaultValue="pricing" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
            <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
            <TabsTrigger value="automations">Automations</TabsTrigger>
            <TabsTrigger value="elite" className="relative">
              <Crown className="w-4 h-4 mr-1 text-yellow-500" />
              Dominus's Lab
            </TabsTrigger>
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
                  <CardFooter className="flex-col gap-2">
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase('scraper', scraper.id)}
                      disabled={processingPayment === scraper.id || processingPayment === scraper.id + '-license'}
                    >
                      {processingPayment === scraper.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Single Use - ${scraper.price_per_use}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePurchase('scraper', scraper.id, true)}
                      disabled={processingPayment === scraper.id || processingPayment === scraper.id + '-license'}
                    >
                      {processingPayment === scraper.id + '-license' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          License - ${(scraper.price_per_use * 10).toFixed(2)}
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
                  <CardFooter className="flex-col gap-2">
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase('automation', automation.id)}
                      disabled={processingPayment === automation.id || processingPayment === automation.id + '-license'}
                    >
                      {processingPayment === automation.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Single Use - ${automation.price_per_use}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePurchase('automation', automation.id, true)}
                      disabled={processingPayment === automation.id || processingPayment === automation.id + '-license'}
                    >
                      {processingPayment === automation.id + '-license' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          License - ${(automation.price_per_use * 10).toFixed(2)}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Dominus's Lab - Elite Section */}
          <TabsContent value="elite" className="space-y-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <Skull className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-primary to-purple-500">
                  Dominus's Lab
                </h2>
                <Skull className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Military-grade automations for elite operators. These weapons-grade tools are reserved for premium subscribers only.
              </p>
            </div>

            {!isEliteMember ? (
              /* Vault Animation for Non-Elite Members */
              <div className="relative max-w-2xl mx-auto">
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 shadow-2xl">
                  <div 
                    className={`transition-all duration-1000 ${vaultAnimating ? 'scale-105 brightness-125' : 'scale-100 brightness-75'}`}
                  >
                    <img 
                      src={eliteVaultImage} 
                      alt="Elite Vault" 
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col items-center justify-end pb-12">
                    <Lock className={`w-16 h-16 mb-4 transition-all duration-500 ${vaultAnimating ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                    <h3 className="text-2xl font-bold mb-2">Access Restricted</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md px-4">
                      Elite automations are locked. Upgrade to a Premium plan to unlock Dominus's most powerful weapons.
                    </p>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-yellow-500 via-primary to-purple-500 hover:opacity-90"
                      onClick={() => {
                        const pricingTab = document.querySelector('[value="pricing"]') as HTMLElement;
                        pricingTab?.click();
                      }}
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Unlock Elite Access
                    </Button>
                  </div>

                  {/* Animated glow effect */}
                  <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${vaultAnimating ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
                  </div>
                </div>

                {/* Teaser cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 blur-sm pointer-events-none">
                  {eliteAutomations.map((automation) => (
                    <Card key={automation.id} className="border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Skull className="w-5 h-5 text-primary" />
                          {automation.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{automation.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Elite Content for Premium Members */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eliteAutomations.map((automation) => (
                  <Card key={automation.id} className="border-2 border-yellow-500/50 bg-gradient-to-br from-background to-primary/5 shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Skull className="h-10 w-10 text-primary" />
                        <Badge className="bg-gradient-to-r from-yellow-500 via-primary to-purple-500 text-white">
                          <Crown className="h-3 w-3 mr-1" />
                          ELITE
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 text-xl">{automation.name}</CardTitle>
                      <CardDescription className="text-base">{automation.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary mb-4">
                        ${automation.price_per_use}
                        <span className="text-sm font-normal text-muted-foreground">/use</span>
                      </div>
                      
                      {/* Features list */}
                      {automation.config?.features && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Capabilities:</p>
                          <ul className="grid grid-cols-2 gap-1">
                            {automation.config.features.map((feature: string, idx: number) => (
                              <li key={idx} className="text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-yellow-500 via-primary to-purple-500 hover:opacity-90"
                        onClick={() => handlePurchase('automation', automation.id)}
                        disabled={processingPayment === automation.id || processingPayment === automation.id + '-license'}
                      >
                        {processingPayment === automation.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Skull className="h-4 w-4 mr-2" />
                            Deploy - ${automation.price_per_use}
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-primary/50"
                        onClick={() => handlePurchase('automation', automation.id, true)}
                        disabled={processingPayment === automation.id || processingPayment === automation.id + '-license'}
                      >
                        {processingPayment === automation.id + '-license' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Lifetime License - ${(automation.price_per_use * 10).toFixed(2)}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;
