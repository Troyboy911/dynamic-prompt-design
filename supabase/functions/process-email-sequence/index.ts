import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[EMAIL-SEQUENCE] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('resend_api_key');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logStep('Starting email sequence processing');

    // Get all active email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('trigger_day', { ascending: true });

    if (templatesError) {
      throw templatesError;
    }

    logStep('Loaded templates', { count: templates?.length });

    // Get users who need emails (not converted, still in trial or just after)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .is('converted_at', null)
      .order('created_at', { ascending: true });

    if (profilesError) {
      throw profilesError;
    }

    logStep('Found profiles to process', { count: profiles?.length });

    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
    };

    for (const profile of profiles || []) {
      results.processed++;

      // Calculate days since signup
      const signupDate = new Date(profile.trial_started_at || profile.created_at);
      const now = new Date();
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

      // Find the appropriate template for this day
      const template = templates?.find(t => t.trigger_day === daysSinceSignup);
      
      if (!template) {
        logStep('No template for day', { userId: profile.id, daysSinceSignup });
        continue;
      }

      // Check if we already sent this template today
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', profile.id)
        .eq('email_type', template.name)
        .single();

      if (existingLog) {
        logStep('Email already sent', { userId: profile.id, template: template.name });
        continue;
      }

      // Calculate trial end date
      const trialEndDate = new Date(profile.trial_ends_at);
      const formattedDate = trialEndDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Replace placeholders
      let htmlContent = template.html_content;
      htmlContent = htmlContent
        .replace(/{{name}}/g, profile.full_name || 'there')
        .replace(/{{trial_end_date}}/g, formattedDate)
        .replace(/{{email}}/g, profile.email);

      try {
        // Send email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'Stellarc Dynamics <noreply@stellarcdynamics.com>',
          to: [profile.email],
          subject: template.subject,
          html: htmlContent,
        });

        if (emailError) {
          throw emailError;
        }

        logStep('Email sent', { userId: profile.id, template: template.name });
        results.sent++;

        // Log the email
        await supabase.from('email_logs').insert({
          user_id: profile.id,
          email_type: template.name,
          subject: template.subject,
          sent_at: new Date().toISOString(),
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({ 
            last_email_sent_at: new Date().toISOString(),
            email_sequence_step: template.trigger_day + 1
          })
          .eq('id', profile.id);

      } catch (sendError: any) {
        logStep('Send error', { userId: profile.id, error: sendError.message });
        results.errors++;

        // Log the error
        await supabase.from('email_logs').insert({
          user_id: profile.id,
          email_type: template.name,
          subject: template.subject,
          error_message: sendError.message,
        });
      }
    }

    logStep('Processing complete', results);

    return new Response(
      JSON.stringify({ success: true, results }),
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
