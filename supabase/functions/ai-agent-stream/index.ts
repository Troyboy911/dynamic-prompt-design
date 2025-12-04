import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter available models - expanded with Claude and Llama 4
const OPENROUTER_MODELS: Record<string, string> = {
  'openrouter/auto': 'openrouter/auto',
  'openrouter/claude-sonnet-4.5': 'anthropic/claude-sonnet-4',
  'openrouter/claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'openrouter/claude-3-opus': 'anthropic/claude-3-opus',
  'openrouter/gpt-4-turbo': 'openai/gpt-4-turbo',
  'openrouter/gpt-4o': 'openai/gpt-4o',
  'openrouter/gpt-4o-mini': 'openai/gpt-4o-mini',
  'openrouter/llama-4-maverick': 'meta-llama/llama-4-maverick',
  'openrouter/llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
  'openrouter/llama-3.1-405b': 'meta-llama/llama-3.1-405b-instruct',
  'openrouter/mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
  'openrouter/mistral-large': 'mistralai/mistral-large',
  'openrouter/gemini-pro': 'google/gemini-pro-1.5',
  'openrouter/deepseek-coder': 'deepseek/deepseek-coder',
  'openrouter/qwen-72b': 'qwen/qwen-2-72b-instruct',
  // Direct model mappings
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4',
  'llama-4-maverick': 'meta-llama/llama-4-maverick',
};

// MCP-style tools for the agent
const MCP_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_scrape",
      description: "Scrape content from a website URL. Returns HTML or extracted text content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to scrape" },
          selector: { type: "string", description: "CSS selector to target specific elements (optional)" },
          extract_type: { type: "string", enum: ["text", "html", "links", "images"], description: "What to extract" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "notion_search",
      description: "Search Notion workspace for pages and databases",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          filter_type: { type: "string", enum: ["page", "database"], description: "Filter by type" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "notion_create_page",
      description: "Create a new page in Notion",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Page title" },
          content: { type: "string", description: "Page content in markdown" },
          parent_id: { type: "string", description: "Parent page or database ID" }
        },
        required: ["title", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "github_search",
      description: "Search GitHub repositories or code",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          search_type: { type: "string", enum: ["repositories", "code", "issues"], description: "Type of search" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email via configured email service",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body (HTML supported)" }
        },
        required: ["to", "subject", "body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image using AI (ComfyUI/DALL-E style)",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Image generation prompt" },
          style: { type: "string", description: "Style preset (realistic, artistic, anime, etc.)" },
          size: { type: "string", enum: ["512x512", "1024x1024", "1792x1024"], description: "Image size" }
        },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_automation",
      description: "Execute a stored automation by name or ID",
      parameters: {
        type: "object",
        properties: {
          automation_id: { type: "string", description: "Automation ID or name" },
          input_data: { type: "object", description: "Input parameters for the automation" }
        },
        required: ["automation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_scraper",
      description: "Execute a stored scraper by name or ID",
      parameters: {
        type: "object",
        properties: {
          scraper_id: { type: "string", description: "Scraper ID or name" },
          target_url: { type: "string", description: "URL to scrape" },
          parameters: { type: "object", description: "Additional scraper parameters" }
        },
        required: ["scraper_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "database_query",
      description: "Query the database for records",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name (scrapers, automations, etc.)" },
          filters: { type: "object", description: "Query filters" },
          limit: { type: "number", description: "Max results to return" }
        },
        required: ["table"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_user_input",
      description: "Request additional information from the user when details are missing",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question to ask the user" },
          input_type: { type: "string", enum: ["text", "choice", "confirmation"], description: "Type of input expected" },
          options: { type: "array", items: { type: "string" }, description: "Options for choice type" }
        },
        required: ["question"]
      }
    }
  }
];

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
  enableTools: z.boolean().optional().default(true),
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

    const { prompt, model, automationConfig, enableTools } = validationResult.data;

    // Determine API provider and model
    let apiUrl = '';
    let apiKey = '';
    let apiModel = '';

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const perplexityKey = Deno.env.get('perplexity_api_key') || '';
    const openaiKey = Deno.env.get('openai_api_key') || '';

    console.log(`Model requested: ${model}, OpenRouter key present: ${!!openrouterKey}`);

    // Route based on model prefix and available keys
    if (openrouterKey && (model.startsWith('openrouter/') || model.startsWith('claude-') || model.startsWith('llama-'))) {
      // Use OpenRouter for OpenRouter models, Claude, and Llama
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = openrouterKey;
      apiModel = OPENROUTER_MODELS[model] || OPENROUTER_MODELS[`openrouter/${model}`] || model;
      console.log(`Using OpenRouter: ${model} -> ${apiModel}`);
    } else if (model.startsWith('sonar') && perplexityKey) {
      // Perplexity models
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      apiKey = perplexityKey;
      apiModel = model;
    } else if (model.startsWith('openai/') && openaiKey) {
      // OpenAI direct models
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = openaiKey;
      apiModel = model.replace('openai/', '');
    } else if (lovableKey) {
      // Fallback to Lovable AI Gateway with supported models
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiKey = lovableKey;
      // Map to Lovable AI supported models
      if (model.includes('claude') || model.includes('sonnet')) {
        apiModel = 'google/gemini-2.5-pro'; // Best reasoning alternative
      } else if (model.includes('gpt-5') || model.includes('gpt5')) {
        apiModel = 'openai/gpt-5';
      } else if (model.includes('gpt-4')) {
        apiModel = 'openai/gpt-5-mini';
      } else if (model.includes('gemini')) {
        apiModel = 'google/gemini-2.5-flash';
      } else {
        apiModel = 'google/gemini-2.5-flash'; // Default fast model
      }
      console.log(`Fallback to Lovable AI: ${model} -> ${apiModel}`);
    } else if (openrouterKey) {
      // Default to OpenRouter auto if key is available
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = openrouterKey;
      apiModel = 'openrouter/auto';
      console.log(`Default to OpenRouter auto`);
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No AI service configured. Please add OPENROUTER_API_KEY or configure another provider.' }),
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

    // Enhanced system prompt with MCP tool awareness
    const systemPrompt = `You are an advanced Admin Automation Agent for Stellarc Dynamics with comprehensive MCP (Model Context Protocol) capabilities.

**CRITICAL INSTRUCTIONS:**
1. ALWAYS follow the exact instructions provided in automation configurations
2. If you need ANY information to complete a task that wasn't provided, use the request_user_input tool
3. Do NOT make assumptions about missing data - always ask using the tools
4. Execute tasks step-by-step and report progress
5. If an automation has specific steps defined, follow them in order

${automationContext}

**MCP TOOLS AVAILABLE:**
You have access to the following MCP server tools:
- web_scrape: Scrape content from websites (supports CSS selectors)
- notion_search / notion_create_page: Interact with Notion workspace
- github_search: Search GitHub repositories and code
- send_email: Send emails via configured service
- generate_image: Generate images with AI
- run_automation: Execute stored automations
- run_scraper: Execute stored scrapers
- database_query: Query the database for records
- request_user_input: Ask user for missing information

**YOUR APPROACH:**
1. Analyze the request and identify ALL required information
2. If ANY information is missing, use request_user_input tool
3. Use the appropriate MCP tools to complete tasks
4. Break complex tasks into manageable steps
5. Report results with actionable details
6. Suggest optimizations and next steps

**AVAILABLE SCRAPERS:** News Article, Product Data, Website Content, Job Listings, E-commerce Product, Social Media, Real Estate
**AVAILABLE AUTOMATIONS:** Contact Form Handler, Invoice Generator, Social Media Scheduler, App Builder, Report Generator, Data Analysis

REMEMBER: Use MCP tools for actions. Use request_user_input when information is missing. Never proceed with incomplete data.`;

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

    // Build request body with optional tools
    const requestBody: any = {
      model: apiModel,
      messages,
      stream: true,
      temperature: 0.5,
      max_tokens: 4000,
    };

    // Add tools if enabled and using OpenRouter (supports function calling)
    if (enableTools && apiUrl.includes('openrouter')) {
      requestBody.tools = MCP_TOOLS;
      requestBody.tool_choice = 'auto';
    }

    // Call AI API with streaming
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stellarcdynamics.com',
        'X-Title': 'Stellarc Dynamics Admin Agent',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}`, details: errorText }),
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
        let toolCalls: any[] = [];

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
                  const choice = parsed.choices?.[0];
                  
                  // Handle regular content
                  const content = choice?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }

                  // Handle tool calls
                  const toolCall = choice?.delta?.tool_calls?.[0];
                  if (toolCall) {
                    if (toolCall.id) {
                      toolCalls.push({ id: toolCall.id, name: '', arguments: '' });
                    }
                    if (toolCall.function?.name && toolCalls.length > 0) {
                      toolCalls[toolCalls.length - 1].name = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments && toolCalls.length > 0) {
                      toolCalls[toolCalls.length - 1].arguments += toolCall.function.arguments;
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // If there were tool calls, append them to the response
          if (toolCalls.length > 0) {
            const toolCallsMsg = `\n\n**Tool Calls Requested:**\n${toolCalls.map(tc => 
              `- ${tc.name}: ${tc.arguments}`
            ).join('\n')}`;
            fullResponse += toolCallsMsg;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: toolCallsMsg })}\n\n`));
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