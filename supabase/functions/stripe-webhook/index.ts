import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Send purchase confirmation email
async function sendPurchaseConfirmationEmail(
  email: string, 
  itemName: string, 
  itemType: string, 
  amount: number,
  isLicense: boolean
): Promise<void> {
  const resendKey = Deno.env.get('resend_api_key');
  if (!resendKey) {
    logStep('WARNING: resend_api_key not configured, skipping email');
    return;
  }

  const resend = new Resend(resendKey);

  const purchaseType = isLicense ? 'Lifetime License' : 'Single Use';
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Stellarc Dynamics <noreply@stellarcdynamics.com>',
      to: [email],
      subject: `Purchase Confirmation - ${itemName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #0891b2 0%, #06b6d4 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Stellarc Dynamics</h1>
              <p style="color: #e0f2fe; margin: 8px 0 0 0; font-size: 14px;">Thank you for your purchase!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <div style="background: rgba(8, 145, 178, 0.1); border: 1px solid rgba(8, 145, 178, 0.3); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #22d3ee; margin: 0 0 16px 0; font-size: 20px;">Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">Item</td>
                    <td style="color: #f1f5f9; padding: 8px 0; text-align: right; border-bottom: 1px solid rgba(148, 163, 184, 0.2); font-weight: 600;">${itemName}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">Type</td>
                    <td style="color: #f1f5f9; padding: 8px 0; text-align: right; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">${itemType.charAt(0).toUpperCase() + itemType.slice(1)} - ${purchaseType}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0;">Amount Paid</td>
                    <td style="color: #22d3ee; padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px;">$${amount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(90deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Access Your Purchase</a>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Your purchase is now active and ready to use. Visit the marketplace to access your ${itemType}.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 24px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1);">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">Questions? Contact us at contact@stellarcdynamics.com</p>
              <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Stellarc Dynamics. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logStep('Email send error', { error });
    } else {
      logStep('Purchase confirmation email sent', { email, messageId: data?.id });
    }
  } catch (err) {
    logStep('Failed to send email', { error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

// Send subscription confirmation email
async function sendSubscriptionConfirmationEmail(
  email: string, 
  tierName: string, 
  amount: number
): Promise<void> {
  const resendKey = Deno.env.get('resend_api_key');
  if (!resendKey) {
    logStep('WARNING: resend_api_key not configured, skipping email');
    return;
  }

  const resend = new Resend(resendKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Stellarc Dynamics <noreply@stellarcdynamics.com>',
      to: [email],
      subject: `Welcome to ${tierName} - Subscription Confirmed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #0891b2 0%, #06b6d4 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Welcome to ${tierName}!</h1>
              <p style="color: #e0f2fe; margin: 8px 0 0 0; font-size: 14px;">Your subscription is now active</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <div style="background: rgba(8, 145, 178, 0.1); border: 1px solid rgba(8, 145, 178, 0.3); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #22d3ee; margin: 0 0 16px 0; font-size: 20px;">Subscription Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">Plan</td>
                    <td style="color: #f1f5f9; padding: 8px 0; text-align: right; border-bottom: 1px solid rgba(148, 163, 184, 0.2); font-weight: 600;">${tierName}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">Billing</td>
                    <td style="color: #f1f5f9; padding: 8px 0; text-align: right; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">Monthly</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 8px 0;">Amount</td>
                    <td style="color: #22d3ee; padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px;">$${amount.toFixed(2)}/month</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(90deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore the Marketplace</a>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                You now have full access to all ${tierName} features. Explore our scrapers, automations, and AI-powered tools in the marketplace.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 24px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1);">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">Questions? Contact us at contact@stellarcdynamics.com</p>
              <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Stellarc Dynamics. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logStep('Email send error', { error });
    } else {
      logStep('Subscription confirmation email sent', { email, messageId: data?.id });
    }
  } catch (err) {
    logStep('Failed to send email', { error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

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
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (!userId) {
          logStep('No user_id in metadata, skipping');
          break;
        }

        // Get user email from profiles if not in session
        let userEmail = customerEmail;
        if (!userEmail) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
          userEmail = profile?.email;
        }

        if (session.mode === 'subscription') {
          // Handle subscription creation
          const pricingTierId = metadata.pricing_tier_id;
          const stripeSubscriptionId = session.subscription as string;

          logStep('Creating subscription record', { userId, pricingTierId, stripeSubscriptionId });

          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          // Get pricing tier details for email
          const { data: pricingTier } = await supabaseClient
            .from('pricing_tiers')
            .select('name, price_monthly')
            .eq('id', pricingTierId)
            .single();
          
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

          // Send subscription confirmation email
          if (userEmail && pricingTier) {
            await sendSubscriptionConfirmationEmail(
              userEmail,
              pricingTier.name,
              Number(pricingTier.price_monthly)
            );
          }

          logStep('Subscription created and user marked as converted');
        } else if (session.mode === 'payment') {
          // Handle one-time payment
          const itemType = metadata.item_type;
          const itemId = metadata.item_id;
          const isLicense = metadata.is_license === 'true';
          const paymentIntentId = session.payment_intent as string;

          logStep('Recording purchase', { userId, itemType, itemId, isLicense, paymentIntentId });

          // Get item details for email
          const tableName = itemType === 'scraper' ? 'scrapers' : 'automations';
          const { data: item } = await supabaseClient
            .from(tableName)
            .select('name, price_per_use')
            .eq('id', itemId)
            .single();

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

          // Send purchase confirmation email
          if (userEmail && item) {
            await sendPurchaseConfirmationEmail(
              userEmail,
              item.name,
              itemType,
              session.amount_total ? session.amount_total / 100 : 0,
              isLicense
            );
          }

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
