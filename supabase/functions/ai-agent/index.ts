import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, taskType = 'general' } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    console.log('Processing AI request:', { taskType, promptLength: prompt.length, userId });

    // Create log entry
    const logEntry = {
      user_id: userId,
      task_type: taskType,
      status: 'processing',
      input_data: { prompt, taskType },
      model_used: 'gpt-4o',
    };

    const { data: logData } = await supabase
      .from('automation_logs')
      .insert(logEntry)
      .select()
      .single();

    const logId = logData?.id;

    try {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an advanced Admin Automation Agent with capabilities for:
- Intelligent task analysis and planning
- Data extraction and processing
- Workflow automation recommendations
- API integration suggestions

Provide clear, actionable responses with step-by-step instructions when needed.`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      const executionTime = Date.now() - startTime;

      // Update log with success
      if (logId) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            output_data: { result, model: 'gpt-4o' },
            execution_time_ms: executionTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      console.log('AI request completed successfully:', { executionTime, logId });

      return new Response(
        JSON.stringify({ 
          result, 
          executionTime,
          logId,
          model: 'gpt-4o'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update log with error
      if (logId) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'error',
            error_message: errorMessage,
            execution_time_ms: executionTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      console.error('AI agent error:', errorMessage);
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Request handling error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
