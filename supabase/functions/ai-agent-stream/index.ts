import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema - userId removed, will be extracted from JWT
const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(10000, "Prompt too long"),
  model: z.string().max(100).optional().default('sonar-reasoning-pro'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id; // Use verified user ID from JWT

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, model } = validationResult.data;

    // Determine API configuration based on model
    let apiUrl: string;
    let apiKey: string;
    let apiModel: string;

    if (model.startsWith('sonar')) {
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      apiKey = Deno.env.get('perplexity_api_key') || '';
      apiModel = model;
    } else if (model.startsWith('gpt-')) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = Deno.env.get('openai_api_key') || '';
      apiModel = model;
    } else if (model.startsWith('gemini')) {
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
      apiModel = `google/${model}`;
    } else if (model.startsWith('openrouter')) {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = Deno.env.get('openrouter_api_key') || '';
      apiModel = model.replace('openrouter/', '');
    } else {
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      apiKey = Deno.env.get('perplexity_api_key') || '';
      apiModel = 'sonar-reasoning-pro';
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: history } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Filter history to ensure alternating user/assistant messages
    const filteredHistory: any[] = [];
    let lastRole = 'system';
    
    if (history) {
      for (const msg of history) {
        if (msg.role !== lastRole && (msg.role === 'user' || msg.role === 'assistant')) {
          filteredHistory.push({ role: msg.role, content: msg.content });
          lastRole = msg.role;
        }
      }
    }

    // Ensure the last message in history is from assistant if we're adding a user message
    if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === 'user') {
      filteredHistory.pop();
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant for Stellarc Dynamics admin panel. Help with website management, content creation, automation, and technical tasks.' },
      ...filteredHistory,
      { role: 'user', content: prompt }
    ];

    // Save user message to history
    await supabase.from('conversation_history').insert({
      user_id: userId,
      role: 'user',
      content: prompt,
      model: apiModel
    });

    // Call AI API with streaming
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Save assistant response to history
          if (fullResponse) {
            await supabase.from('conversation_history').insert({
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
              model: apiModel
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});