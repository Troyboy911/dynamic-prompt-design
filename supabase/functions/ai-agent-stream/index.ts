import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter available models
const OPENROUTER_MODELS: Record<string, string> = {
  'openrouter/auto': 'openrouter/auto',
  'openrouter/claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'openrouter/claude-3-opus': 'anthropic/claude-3-opus',
  'openrouter/gpt-4-turbo': 'openai/gpt-4-turbo',
  'openrouter/gpt-4o': 'openai/gpt-4o',
  'openrouter/gpt-4o-mini': 'openai/gpt-4o-mini',
  'openrouter/llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
  'openrouter/llama-3.1-405b': 'meta-llama/llama-3.1-405b-instruct',
  'openrouter/mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
  'openrouter/mistral-large': 'mistralai/mistral-large',
  'openrouter/gemini-pro': 'google/gemini-pro-1.5',
  'openrouter/deepseek-coder': 'deepseek/deepseek-coder',
  'openrouter/qwen-72b': 'qwen/qwen-2-72b-instruct',
};

// Input validation schema
const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(10000, "Prompt too long"),
  model: z.string().max(100).optional().default('openrouter/auto'),
  automationConfig: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
  }).optional(),
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

    const userId = user.id;

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

    const { prompt, model, automationConfig } = validationResult.data;

    // Default to OpenRouter
    let apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    let apiKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('openrouter_api_key') || '';
    let apiModel = OPENROUTER_MODELS[model] || OPENROUTER_MODELS['openrouter/auto'] || 'openrouter/auto';

    // Fallback to other providers if OpenRouter not configured
    if (!apiKey) {
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
      } else {
        // Final fallback to Lovable AI
        apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
        apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
        apiModel = 'google/gemini-2.5-flash';
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No AI service configured. Please add OPENROUTER_API_KEY.' }),
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
    const filteredHistory: { role: string; content: string }[] = [];
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

    // Build automation context if provided
    let automationContext = '';
    if (automationConfig) {
      automationContext = `
**AUTOMATION CONTEXT:**
- Name: ${automationConfig.name || 'Custom Automation'}
- Type: ${automationConfig.type || 'general'}
- Description: ${automationConfig.description || 'No description provided'}
- Configuration: ${JSON.stringify(automationConfig.config || {})}

You MUST follow the automation configuration above. Execute the steps as defined.
`;
    }

    // Enhanced system prompt
    const systemPrompt = `You are an advanced Admin Automation Agent for Stellarc Dynamics with comprehensive capabilities.

**CRITICAL INSTRUCTIONS:**
1. ALWAYS follow the exact instructions provided in automation configurations
2. If you need ANY information to complete a task that wasn't provided, you MUST ask the user for it
3. Do NOT make assumptions about missing data - always ask
4. Execute tasks step-by-step and report progress
5. If an automation has specific steps defined, follow them in order

${automationContext}

**CAPABILITIES:**
- Web scraping and browser automation via Playwright
- MCP server connections (Notion, GitHub, Slack, etc.)
- API integrations with any REST endpoint
- Content generation (articles, emails, code, documentation)
- Data analysis (statistical, trends, predictions, sentiment)
- Workflow automation and scheduling
- File processing (PDF, images, documents)
- Database operations
- Email campaigns
- Image generation

**YOUR APPROACH:**
1. Analyze the request and identify ALL required information
2. If ANY information is missing, ask the user for it clearly
3. Break complex tasks into manageable steps
4. Report results with actionable details
5. Suggest optimizations and next steps

REMEMBER: Never proceed with incomplete information. Always ask for clarification when needed.`;

    const messages = [
      { role: 'system', content: systemPrompt },
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
        'HTTP-Referer': 'https://stellarcdynamics.com',
        'X-Title': 'Stellarc Dynamics Admin Agent',
      },
      body: JSON.stringify({
        model: apiModel,
        messages,
        stream: true,
        temperature: 0.5,
        max_tokens: 4000,
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
