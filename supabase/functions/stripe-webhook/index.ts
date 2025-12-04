import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      logStep('ERROR: STRIPE_WEBHOOK_SECRET not configured - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      logStep('ERROR: Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep('Signature verified successfully', { type: event.type, id: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep('ERROR: Signature verification failed', { error: errorMessage });
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep('Checkout session completed', { 
          sessionId: session.id, 
          mode: session.mode,
          metadata: session.metadata 
        });

        const metadata = session.metadata || {};
        const userId = metadata.user_id;

        if (!userId) {
          logStep('No user_id in metadata, skipping');
          break;
        }

        if (session.mode === 'subscription') {
          // Handle subscription creation
          const pricingTierId = metadata.pricing_tier_id;
          const stripeSubscriptionId = session.subscription as string;

          logStep('Creating subscription record', { userId, pricingTierId, stripeSubscriptionId });

          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          const { error: subError } = await supabaseClient
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              pricing_tier_id: pricingTierId,
              stripe_subscription_id: stripeSubscriptionId,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              usage_count: 0,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });

          if (subError) {
            logStep('Error creating subscription', { error: subError });
            throw subError;
          }

          // Mark user as converted in profiles
          await supabaseClient
            .from('profiles')
            .update({ converted_at: new Date().toISOString() })
            .eq('id', userId);

          logStep('Subscription created and user marked as converted');
        } else if (session.mode === 'payment') {
          // Handle one-time payment
          const itemType = metadata.item_type;
          const itemId = metadata.item_id;
          const isLicense = metadata.is_license === 'true';
          const paymentIntentId = session.payment_intent as string;

          logStep('Recording purchase', { userId, itemType, itemId, isLicense, paymentIntentId });

          const { error: purchaseError } = await supabaseClient
            .from('user_purchases')
            .insert({
              user_id: userId,
              item_type: isLicense ? `${itemType}_license` : itemType,
              item_id: itemId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              status: 'completed',
              stripe_payment_intent_id: paymentIntentId,
            });

          if (purchaseError) {
            logStep('Error recording purchase', { error: purchaseError });
            throw purchaseError;
          }

          // Mark user as converted in profiles
          await supabaseClient
            .from('profiles')
            .update({ converted_at: new Date().toISOString() })
            .eq('id', userId);

          logStep('Purchase recorded and user marked as converted');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });

        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep('Error updating subscription', { error });
        } else {
          logStep('Subscription updated successfully');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription cancelled', { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep('Error cancelling subscription', { error });
        } else {
          logStep('Subscription cancelled successfully');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        logStep('Payment failed', { subscriptionId });

        if (subscriptionId) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            logStep('Error updating subscription status', { error });
          }
        }
        break;
      }

      default:
        logStep('Unhandled event type', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
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
