import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[WELCOME-EMAIL] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request source - require service role key or internal secret
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Only allow calls from service role (internal triggers) or with valid auth
    if (!authHeader || !authHeader.includes(serviceRoleKey || '___never_match___')) {
      // Also check for internal API secret as fallback
      const internalSecret = req.headers.get('x-internal-secret');
      const expectedSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (internalSecret !== expectedSecret) {
        logStep('Unauthorized request attempt');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const resendApiKey = Deno.env.get('resend_api_key');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, email, fullName } = await req.json();
    logStep('Processing welcome email', { userId, email });

    if (!userId || !email) {
      throw new Error('userId and email are required');
    }

    // Verify user exists in auth.users via profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logStep('User not found', { userId });
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get welcome email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'welcome')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      logStep('Template not found, using default');
    }

    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    const formattedDate = trialEndDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Replace placeholders in template
    let htmlContent = template?.html_content || getDefaultWelcomeEmail();
    htmlContent = htmlContent
      .replace(/{{name}}/g, fullName || 'there')
      .replace(/{{trial_end_date}}/g, formattedDate)
      .replace(/{{email}}/g, email);

    const subject = template?.subject || 'Welcome to Stellarc Dynamics - Your AI Journey Begins! 🚀';

    // Send email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Stellarc Dynamics <noreply@stellarcdynamics.com>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (emailError) {
      logStep('Email send error', emailError);
      throw emailError;
    }

    logStep('Email sent successfully', emailResult);

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: 'welcome',
      subject: subject,
      sent_at: new Date().toISOString(),
    });

    // Update profile
    await supabase
      .from('profiles')
      .update({ 
        last_email_sent_at: new Date().toISOString(),
        email_sequence_step: 1
      })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logStep('Error', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDefaultWelcomeEmail(): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0f; color: #ffffff;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #00d4ff; margin: 0;">Welcome to Stellarc Dynamics</h1>
  </div>
  <div style="padding: 20px; background-color: #1a1a2e; border-radius: 10px; border: 1px solid #00d4ff33;">
    <p>Hi {{name}},</p>
    <p>Welcome aboard! You've just unlocked access to the most powerful AI automation platform on the market.</p>
    <p><strong>Your 7-day free trial includes:</strong></p>
    <ul>
      <li>Access to our AI agents and automations</li>
      <li>One free mid-tier tool to test</li>
      <li>Full marketplace access</li>
    </ul>
    <p>Your trial ends on <strong>{{trial_end_date}}</strong>.</p>
    <a href="https://stellarcdynamics.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0066cc); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Explore the Marketplace</a>
    <p>Need help getting started? Reply to this email!</p>
    <p>Best,<br>The Stellarc Dynamics Team</p>
  </div>
</body>
</html>`;
}