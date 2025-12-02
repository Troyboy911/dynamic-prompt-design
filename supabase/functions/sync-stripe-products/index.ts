import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    const results = {
      pricing_tiers: [] as any[],
      scrapers: [] as any[],
      automations: [] as any[],
    };

    // Sync Pricing Tiers (Subscriptions)
    const { data: pricingTiers } = await supabaseClient
      .from('pricing_tiers')
      .select('*');

    if (pricingTiers) {
      for (const tier of pricingTiers) {
        logStep('Processing pricing tier', { name: tier.name });

        let stripeProduct: Stripe.Product;
        let stripePrice: Stripe.Price;

        // Check if product exists
        if (tier.stripe_product_id) {
          try {
            stripeProduct = await stripe.products.retrieve(tier.stripe_product_id);
            // Update product
            stripeProduct = await stripe.products.update(tier.stripe_product_id, {
              name: `Stellarc ${tier.name}`,
              description: tier.description || undefined,
              active: true,
            });
            logStep('Updated existing product', { productId: stripeProduct.id });
          } catch (e) {
            // Product doesn't exist, create new
            stripeProduct = await stripe.products.create({
              name: `Stellarc ${tier.name}`,
              description: tier.description || undefined,
            });
            logStep('Created new product', { productId: stripeProduct.id });
          }
        } else {
          // Create new product
          stripeProduct = await stripe.products.create({
            name: `Stellarc ${tier.name}`,
            description: tier.description || undefined,
          });
          logStep('Created new product', { productId: stripeProduct.id });
        }

        // Check if price needs update (create new price if amount changed)
        const amountInCents = Math.round(Number(tier.price_monthly) * 100);
        
        if (tier.stripe_price_id) {
          try {
            const existingPrice = await stripe.prices.retrieve(tier.stripe_price_id);
            if (existingPrice.unit_amount !== amountInCents) {
              // Price changed, archive old and create new
              await stripe.prices.update(tier.stripe_price_id, { active: false });
              stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: amountInCents,
                currency: 'usd',
                recurring: { interval: 'month' },
              });
              logStep('Created new price (amount changed)', { priceId: stripePrice.id });
            } else {
              stripePrice = existingPrice;
              logStep('Using existing price', { priceId: stripePrice.id });
            }
          } catch (e) {
            // Price doesn't exist, create new
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: amountInCents,
              currency: 'usd',
              recurring: { interval: 'month' },
            });
            logStep('Created new price', { priceId: stripePrice.id });
          }
        } else {
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: amountInCents,
            currency: 'usd',
            recurring: { interval: 'month' },
          });
          logStep('Created new price', { priceId: stripePrice.id });
        }

        // Update database with Stripe IDs
        await supabaseClient
          .from('pricing_tiers')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tier.id);

        results.pricing_tiers.push({
          name: tier.name,
          product_id: stripeProduct.id,
          price_id: stripePrice.id,
        });
      }
    }

    // Sync Scrapers (One-time products)
    const { data: scrapers } = await supabaseClient
      .from('scrapers')
      .select('*');

    if (scrapers) {
      for (const scraper of scrapers) {
        logStep('Processing scraper', { name: scraper.name });

        // Create/update product for single use
        let product: Stripe.Product;
        const productName = `${scraper.name} (Scraper)`;
        
        // Search for existing product by metadata
        const existingProducts = await stripe.products.search({
          query: `metadata['db_id']:'${scraper.id}' AND metadata['type']:'scraper'`,
        });

        if (existingProducts.data.length > 0) {
          product = await stripe.products.update(existingProducts.data[0].id, {
            name: productName,
            description: scraper.description || undefined,
            active: scraper.status === 'active',
          });
          logStep('Updated scraper product', { productId: product.id });
        } else {
          product = await stripe.products.create({
            name: productName,
            description: scraper.description || undefined,
            metadata: {
              db_id: scraper.id,
              type: 'scraper',
            },
          });
          logStep('Created scraper product', { productId: product.id });
        }

        // Create price for single use
        const amountInCents = Math.round(Number(scraper.price_per_use) * 100);
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 1,
        });

        let price: Stripe.Price;
        if (prices.data.length > 0 && prices.data[0].unit_amount === amountInCents) {
          price = prices.data[0];
        } else {
          // Archive old prices
          for (const oldPrice of prices.data) {
            await stripe.prices.update(oldPrice.id, { active: false });
          }
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: amountInCents,
            currency: 'usd',
          });
        }

        results.scrapers.push({
          name: scraper.name,
          product_id: product.id,
          price_id: price.id,
        });
      }
    }

    // Sync Automations (One-time products)
    const { data: automations } = await supabaseClient
      .from('automations')
      .select('*');

    if (automations) {
      for (const automation of automations) {
        logStep('Processing automation', { name: automation.name });

        let product: Stripe.Product;
        const productName = `${automation.name} (Automation)`;
        
        const existingProducts = await stripe.products.search({
          query: `metadata['db_id']:'${automation.id}' AND metadata['type']:'automation'`,
        });

        if (existingProducts.data.length > 0) {
          product = await stripe.products.update(existingProducts.data[0].id, {
            name: productName,
            description: automation.description || undefined,
            active: automation.status === 'active',
          });
          logStep('Updated automation product', { productId: product.id });
        } else {
          product = await stripe.products.create({
            name: productName,
            description: automation.description || undefined,
            metadata: {
              db_id: automation.id,
              type: 'automation',
            },
          });
          logStep('Created automation product', { productId: product.id });
        }

        const amountInCents = Math.round(Number(automation.price_per_use) * 100);
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 1,
        });

        let price: Stripe.Price;
        if (prices.data.length > 0 && prices.data[0].unit_amount === amountInCents) {
          price = prices.data[0];
        } else {
          for (const oldPrice of prices.data) {
            await stripe.prices.update(oldPrice.id, { active: false });
          }
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: amountInCents,
            currency: 'usd',
          });
        }

        results.automations.push({
          name: automation.name,
          product_id: product.id,
          price_id: price.id,
        });
      }
    }

    logStep('Sync completed', results);

    return new Response(
      JSON.stringify({ success: true, synced: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
