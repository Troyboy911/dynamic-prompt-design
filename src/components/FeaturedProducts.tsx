import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

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

const FeaturedProducts = () => {
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [scrapersRes, automationsRes] = await Promise.all([
          supabase
            .from('scrapers')
            .select('*')
            .eq('status', 'active')
            .eq('is_premium', true)
            .limit(2),
          supabase
            .from('automations')
            .select('*')
            .eq('status', 'active')
            .eq('is_premium', true)
            .limit(2),
        ]);

        if (scrapersRes.data) setScrapers(scrapersRes.data);
        if (automationsRes.data) setAutomations(automationsRes.data);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            Popular Tools
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-glow">
            Featured Products
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our most powerful automation tools and scrapers to supercharge your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {scrapers.map((scraper) => (
            <Card key={scraper.id} className="card-glass border-primary/20 hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Globe className="h-8 w-8 text-primary" />
                  <Badge className="bg-gradient-to-r from-primary to-primary/60">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{scraper.name}</CardTitle>
                <CardDescription className="line-clamp-2">{scraper.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
                    ${scraper.price_per_use}
                    <span className="text-sm font-normal text-muted-foreground">/use</span>
                  </div>
                  <Badge variant="outline">{scraper.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {automations.map((automation) => (
            <Card key={automation.id} className="card-glass border-primary/20 hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Zap className="h-8 w-8 text-primary" />
                  <Badge className="bg-gradient-to-r from-primary to-primary/60">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{automation.name}</CardTitle>
                <CardDescription className="line-clamp-2">{automation.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
                    ${automation.price_per_use}
                    <span className="text-sm font-normal text-muted-foreground">/use</span>
                  </div>
                  <Badge variant="outline">{automation.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/marketplace">
            <Button size="lg" className="glow-effect text-lg px-8 py-6">
              Browse All Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
