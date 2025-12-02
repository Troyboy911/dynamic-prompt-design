import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const subscriptionCheckoutSchema = z.object({
  type: z.literal('subscription'),
  priceId: z.string().uuid({ message: 'Invalid pricing tier ID' }),
});

const oneTimeCheckoutSchema = z.object({
  type: z.literal('one_time'),
  itemType: z.enum(['scraper', 'automation'], { message: 'Invalid item type' }),
  itemId: z.string().uuid({ message: 'Invalid item ID' }),
  purchaseLicense: z.boolean().optional(),
});

const checkoutSchema = z.discriminatedUnion('type', [
  subscriptionCheckoutSchema,
  oneTimeCheckoutSchema,
]);

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Rate limiting: Check subscriber usage limits
async function checkRateLimit(supabaseClient: any, userId: string): Promise<{ allowed: boolean; message?: string }> {
  // Get user's active subscription
  const { data: subscription } = await supabaseClient
    .from('user_subscriptions')
    .select('*, pricing_tiers(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    return { allowed: true }; // No subscription, proceed with pay-per-use
  }

  const usageLimit = subscription.pricing_tiers?.usage_limit_monthly;
  if (!usageLimit) {
    return { allowed: true }; // Unlimited plan
  }

  const currentUsage = subscription.usage_count || 0;
  
  if (currentUsage >= usageLimit) {
    return { 
      allowed: false, 
      message: `Monthly usage limit reached (${currentUsage}/${usageLimit}). Please upgrade your plan or wait for the next billing cycle.`
    };
  }

  // Increment usage count
  await supabaseClient
    .from('user_subscriptions')
    .update({ usage_count: currentUsage + 1, updated_at: new Date().toISOString() })
    .eq('id', subscription.id);

  logStep('Rate limit check passed', { userId, currentUsage: currentUsage + 1, limit: usageLimit });
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    // Initialize Supabase client with service role for rate limit checks
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep('Authentication failed', { error: userError?.message });
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    if (!user.email) {
      throw new Error("User email not available");
    }
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Parse and validate request body
    const requestBody = await req.json();
    logStep('Request body received', requestBody);
    
    const validationResult = checkoutSchema.safeParse(requestBody);
    if (!validationResult.success) {
      logStep('Validation failed', { errors: validationResult.error.errors });
      throw new Error(`Invalid request: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
    }
    
    const validatedData = validationResult.data;
    logStep('Request validated', validatedData);

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Found existing Stripe customer', { customerId });
    }

    const origin = req.headers.get('origin') || 'https://stellarcdynamics.com';

    if (validatedData.type === 'subscription') {
      // Fetch subscription price from database
      const { data: pricingTier, error: tierError } = await supabaseClient
        .from('pricing_tiers')
        .select('id, name, price_monthly, stripe_price_id')
        .eq('id', validatedData.priceId)
        .single();

      if (tierError || !pricingTier) {
        logStep('Pricing tier not found', { priceId: validatedData.priceId, error: tierError });
        throw new Error('Invalid pricing tier');
      }

      logStep('Fetched pricing tier', { 
        name: pricingTier.name, 
        price: pricingTier.price_monthly,
        stripePrice: pricingTier.stripe_price_id 
      });

      // Convert price to cents (price_monthly is in dollars)
      const amountInCents = Math.round(Number(pricingTier.price_monthly) * 100);

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Stellarc ${pricingTier.name}`,
              },
              unit_amount: amountInCents,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/marketplace?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/marketplace?canceled=true`,
        metadata: {
          type: 'subscription',
          user_id: user.id,
          pricing_tier_id: pricingTier.id,
        },
      });

      logStep('Subscription checkout session created', { sessionId: session.id });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // One-time payment for scraper or automation
      const tableName = validatedData.itemType === 'scraper' ? 'scrapers' : 'automations';
      
      const { data: item, error: itemError } = await supabaseClient
        .from(tableName)
        .select('id, name, price_per_use')
        .eq('id', validatedData.itemId)
        .single();

      if (itemError || !item) {
        logStep('Item not found', { itemType: validatedData.itemType, itemId: validatedData.itemId, error: itemError });
        throw new Error(`Invalid ${validatedData.itemType}`);
      }

      logStep('Fetched item', { 
        name: item.name, 
        price: item.price_per_use 
      });

      // Check rate limit for subscribers making one-time purchases
      const rateLimitCheck = await checkRateLimit(supabaseClient, user.id);
      if (!rateLimitCheck.allowed) {
        logStep('Rate limit exceeded', { userId: user.id });
        return new Response(
          JSON.stringify({ error: rateLimitCheck.message }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // License purchase multiplier (10x for lifetime license)
      const isLicensePurchase = validatedData.purchaseLicense === true;
      const licenseMultiplier = isLicensePurchase ? 10 : 1;
      const amountInCents = Math.round(Number(item.price_per_use) * 100 * licenseMultiplier);

      // Create one-time payment checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: isLicensePurchase 
                  ? `${item.name} - Lifetime License` 
                  : `${item.name} (${validatedData.itemType})`,
                description: isLicensePurchase 
                  ? 'Unlimited usage - one-time purchase'
                  : 'Single use purchase',
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/marketplace?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/marketplace?canceled=true`,
        metadata: {
          type: 'one_time',
          user_id: user.id,
          item_type: validatedData.itemType,
          item_id: item.id,
          is_license: isLicensePurchase ? 'true' : 'false',
        },
      });

      logStep('One-time checkout session created', { sessionId: session.id, isLicense: isLicensePurchase });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
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
