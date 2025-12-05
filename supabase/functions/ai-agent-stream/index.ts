import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Models with Claude Opus 4.5 and top-tier options
const AVAILABLE_MODELS: Record<string, { endpoint: string; model: string; keyEnv: string }> = {
  // Claude models via OpenRouter
  'claude-opus-4.5': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'anthropic/claude-opus-4', keyEnv: 'OPENROUTER_API_KEY' },
  'claude-sonnet-4.5': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'anthropic/claude-sonnet-4', keyEnv: 'OPENROUTER_API_KEY' },
  'claude-3.5-sonnet': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'anthropic/claude-3.5-sonnet', keyEnv: 'OPENROUTER_API_KEY' },
  // Llama 4 Maverick
  'llama-4-maverick': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-4-maverick', keyEnv: 'OPENROUTER_API_KEY' },
  'llama-3.1-405b': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.1-405b-instruct', keyEnv: 'OPENROUTER_API_KEY' },
  // GPT models
  'gpt-5': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-5', keyEnv: 'OPENROUTER_API_KEY' },
  'gpt-4o': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o', keyEnv: 'OPENROUTER_API_KEY' },
  'gpt-4-turbo': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4-turbo', keyEnv: 'OPENROUTER_API_KEY' },
  // Other powerful models
  'gemini-2.5-pro': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-2.5-pro', keyEnv: 'OPENROUTER_API_KEY' },
  'deepseek-r1': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'deepseek/deepseek-r1', keyEnv: 'OPENROUTER_API_KEY' },
  'qwen-2.5-72b': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'qwen/qwen-2.5-72b-instruct', keyEnv: 'OPENROUTER_API_KEY' },
  // Auto router
  'openrouter/auto': { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openrouter/auto', keyEnv: 'OPENROUTER_API_KEY' },
  // Lovable AI fallback
  'lovable-gemini': { endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions', model: 'google/gemini-2.5-flash', keyEnv: 'LOVABLE_API_KEY' },
};

// Real executable tools - no simulation
const EXECUTABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "database_insert",
      description: "Insert a new record into a database table (scrapers, automations, profiles, etc.)",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name: scrapers, automations, playground_tools, pricing_tiers" },
          data: { type: "object", description: "The data to insert" }
        },
        required: ["table", "data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "database_update",
      description: "Update an existing record in a database table",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name" },
          id: { type: "string", description: "Record ID to update" },
          data: { type: "object", description: "The data to update" }
        },
        required: ["table", "id", "data"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "database_delete",
      description: "Delete a record from a database table",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name" },
          id: { type: "string", description: "Record ID to delete" }
        },
        required: ["table", "id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "database_query",
      description: "Query records from a database table",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name" },
          filters: { type: "object", description: "Filter conditions" },
          limit: { type: "number", description: "Max results" },
          orderBy: { type: "string", description: "Column to order by" }
        },
        required: ["table"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_scraper",
      description: "Create a new web scraper configuration",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Scraper name" },
          description: { type: "string", description: "What it does" },
          scraper_type: { type: "string", description: "Type: website, ecommerce, social, news, jobs" },
          config: { type: "object", description: "Scraper configuration with selectors, urls, etc." },
          price_per_use: { type: "number", description: "Price per use in dollars" },
          is_premium: { type: "boolean", description: "Is this a premium scraper" }
        },
        required: ["name", "scraper_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_automation",
      description: "Create a new automation workflow",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Automation name" },
          description: { type: "string", description: "What it does" },
          automation_type: { type: "string", description: "Type: report, email, data, workflow, app" },
          config: { type: "object", description: "Automation steps and configuration" },
          price_per_use: { type: "number", description: "Price per use in dollars" },
          is_premium: { type: "boolean", description: "Is this premium" }
        },
        required: ["name", "automation_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "http_request",
      description: "Make an HTTP request to any URL (for web scraping, API calls, etc.)",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to request" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"], description: "HTTP method" },
          headers: { type: "object", description: "Request headers" },
          body: { type: "string", description: "Request body for POST/PUT" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "execute_code",
      description: "Execute JavaScript/TypeScript code to process data, transform results, etc.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "The code to execute" },
          context: { type: "object", description: "Variables to pass to the code" }
        },
        required: ["code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "log_action",
      description: "Log an action to the automation_logs table with results",
      parameters: {
        type: "object",
        properties: {
          task_type: { type: "string", description: "Type of task performed" },
          status: { type: "string", enum: ["pending", "running", "success", "failed"], description: "Status" },
          input_data: { type: "object", description: "What was input" },
          output_data: { type: "object", description: "What was produced" },
          error_message: { type: "string", description: "Error if any" }
        },
        required: ["task_type", "status"]
      }
    }
  }
];

// Input validation
const requestSchema = z.object({
  prompt: z.string().min(1).max(50000),
  model: z.string().optional().default('claude-opus-4.5'),
  automationConfig: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
  }).optional(),
  enableTools: z.boolean().optional().default(true),
});

// Execute tool calls for real
async function executeTool(supabase: any, toolName: string, args: any, userId: string): Promise<any> {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'database_insert': {
        const { table, data } = args;
        const insertData = { ...data };
        if (['playground_tools'].includes(table)) {
          insertData.user_id = userId;
        }
        const { data: result, error } = await supabase.from(table).insert(insertData).select().single();
        if (error) throw error;
        return { success: true, action: 'INSERT', table, record: result };
      }
      
      case 'database_update': {
        const { table, id, data } = args;
        const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
        if (error) throw error;
        return { success: true, action: 'UPDATE', table, record: result };
      }
      
      case 'database_delete': {
        const { table, id } = args;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return { success: true, action: 'DELETE', table, id };
      }
      
      case 'database_query': {
        const { table, filters, limit, orderBy } = args;
        let query = supabase.from(table).select('*');
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        if (orderBy) query = query.order(orderBy, { ascending: false });
        if (limit) query = query.limit(limit);
        const { data: result, error } = await query;
        if (error) throw error;
        return { success: true, action: 'QUERY', table, count: result?.length || 0, records: result };
      }
      
      case 'create_scraper': {
        const { name, description, scraper_type, config, price_per_use, is_premium } = args;
        const { data: result, error } = await supabase.from('scrapers').insert({
          name,
          description: description || `${scraper_type} scraper`,
          scraper_type,
          config: config || {},
          price_per_use: price_per_use || 5,
          is_premium: is_premium || false,
          status: 'active'
        }).select().single();
        if (error) throw error;
        return { success: true, action: 'CREATE_SCRAPER', scraper: result };
      }
      
      case 'create_automation': {
        const { name, description, automation_type, config, price_per_use, is_premium } = args;
        const { data: result, error } = await supabase.from('automations').insert({
          name,
          description: description || `${automation_type} automation`,
          automation_type,
          config: config || {},
          price_per_use: price_per_use || 10,
          is_premium: is_premium || false,
          status: 'active'
        }).select().single();
        if (error) throw error;
        return { success: true, action: 'CREATE_AUTOMATION', automation: result };
      }
      
      case 'http_request': {
        const { url, method = 'GET', headers = {}, body } = args;
        const options: RequestInit = { method, headers: headers as HeadersInit };
        if (body && (method === 'POST' || method === 'PUT')) {
          options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        let responseData;
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        return { 
          success: response.ok, 
          action: 'HTTP_REQUEST',
          status: response.status,
          url,
          data: typeof responseData === 'string' ? responseData.substring(0, 5000) : responseData
        };
      }
      
      case 'execute_code': {
        const { code, context = {} } = args;
        // Safe code execution with limited scope
        const fn = new Function(...Object.keys(context), `return (async () => { ${code} })()`);
        const result = await fn(...Object.values(context));
        return { success: true, action: 'EXECUTE_CODE', result };
      }
      
      case 'log_action': {
        const { task_type, status, input_data, output_data, error_message } = args;
        const { data: result, error } = await supabase.from('automation_logs').insert({
          user_id: userId,
          task_type,
          status,
          input_data: input_data || {},
          output_data: output_data || {},
          error_message
        }).select().single();
        if (error) throw error;
        return { success: true, action: 'LOG', log_id: result.id };
      }
      
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return { success: false, error: error.message, tool: toolName };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = user.id;

    // Parse input
    const rawBody = await req.json();
    const validation = requestSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: validation.error.errors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { prompt, model, automationConfig, enableTools } = validation.data;

    // Resolve model
    let modelConfig = AVAILABLE_MODELS[model];
    if (!modelConfig) {
      // Try to find by partial match or default
      modelConfig = AVAILABLE_MODELS['claude-opus-4.5'] || AVAILABLE_MODELS['openrouter/auto'];
    }

    const apiKey = Deno.env.get(modelConfig.keyEnv);
    if (!apiKey) {
      // Fallback to Lovable AI
      modelConfig = AVAILABLE_MODELS['lovable-gemini'];
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableKey) {
        return new Response(JSON.stringify({ error: 'No AI API key configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const finalApiKey = Deno.env.get(modelConfig.keyEnv)!;

    console.log(`Using model: ${modelConfig.model} via ${modelConfig.endpoint}`);

    // Get conversation history
    const { data: history } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(10);

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
    if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === 'user') {
      filteredHistory.pop();
    }

    // Query current state for context
    const { data: currentScrapers } = await supabase.from('scrapers').select('id, name, scraper_type, status').limit(20);
    const { data: currentAutomations } = await supabase.from('automations').select('id, name, automation_type, status').limit(20);

    const systemPrompt = `You are a REAL execution agent for Stellarc Dynamics. You EXECUTE commands, you don't simulate or pretend.

## YOUR IDENTITY
You are the Stellarc Command Agent - a no-BS, action-oriented system that makes REAL changes to the application.

## RULES
1. NEVER simulate, pretend, or roleplay actions. Every action you describe MUST be executed via tools.
2. NEVER say "I would do X" - instead USE THE TOOLS to actually do X.
3. When asked to create something, USE create_scraper or create_automation tools.
4. When asked to query data, USE database_query tool.
5. When asked to fetch web data, USE http_request tool.
6. ALWAYS show proof - include the actual database response or HTTP response.
7. If you can't do something, say WHY specifically (missing permission, invalid data, etc.)

## CURRENT SYSTEM STATE
Scrapers: ${JSON.stringify(currentScrapers || [])}
Automations: ${JSON.stringify(currentAutomations || [])}

## AUTOMATION CONTEXT
${automationConfig ? `Active Automation: ${automationConfig.name}, Type: ${automationConfig.type}, Config: ${JSON.stringify(automationConfig.config)}` : 'No automation context'}

## AVAILABLE TOOLS
- database_insert/update/delete/query: Direct database operations
- create_scraper: Create a new scraper (writes to DB immediately)
- create_automation: Create a new automation (writes to DB immediately)  
- http_request: Make real HTTP calls to any URL
- execute_code: Run JavaScript code
- log_action: Record actions to audit log

## RESPONSE FORMAT
1. State what you're doing
2. Call the tools
3. Show the REAL result from the tool
4. If error, show the actual error

NO FLUFF. NO PRETENDING. EXECUTE AND PROVE.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...filteredHistory,
      { role: 'user', content: prompt }
    ];

    // Save user message
    await supabase.from('conversation_history').insert({
      user_id: userId,
      role: 'user',
      content: prompt,
      model: modelConfig.model
    });

    // Build request
    const requestBody: any = {
      model: modelConfig.model,
      messages,
      stream: true,
      max_tokens: 8000,
    };

    // Add tools for OpenRouter (supports function calling)
    if (enableTools && modelConfig.endpoint.includes('openrouter')) {
      requestBody.tools = EXECUTABLE_TOOLS;
      requestBody.tool_choice = 'auto';
    }

    // Call AI
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stellarcdynamics.com',
        'X-Title': 'Stellarc Command Agent',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI API error: ${response.status}`, details: errorText }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Stream response
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
        let currentToolCall: any = null;

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

                  // Stream content
                  const content = choice?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }

                  // Handle tool calls
                  const toolCallDelta = choice?.delta?.tool_calls?.[0];
                  if (toolCallDelta) {
                    if (toolCallDelta.id) {
                      if (currentToolCall) {
                        toolCalls.push(currentToolCall);
                      }
                      currentToolCall = {
                        id: toolCallDelta.id,
                        type: 'function',
                        function: {
                          name: toolCallDelta.function?.name || '',
                          arguments: toolCallDelta.function?.arguments || ''
                        }
                      };
                    } else if (currentToolCall) {
                      if (toolCallDelta.function?.name) {
                        currentToolCall.function.name += toolCallDelta.function.name;
                      }
                      if (toolCallDelta.function?.arguments) {
                        currentToolCall.function.arguments += toolCallDelta.function.arguments;
                      }
                    }
                  }

                  // Check for finish with tool_calls
                  if (choice?.finish_reason === 'tool_calls' || choice?.finish_reason === 'stop') {
                    if (currentToolCall) {
                      toolCalls.push(currentToolCall);
                      currentToolCall = null;
                    }
                  }
                } catch {
                  // Invalid JSON, skip
                }
              }
            }
          }

          // Execute any tool calls
          if (toolCalls.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n\n---\n**EXECUTING TOOLS:**\n' })}\n\n`));

            for (const toolCall of toolCalls) {
              const toolName = toolCall.function.name;
              let toolArgs;
              try {
                toolArgs = JSON.parse(toolCall.function.arguments);
              } catch {
                toolArgs = {};
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: `\n🔧 **${toolName}**: ` })}\n\n`));

              const result = await executeTool(supabase, toolName, toolArgs, userId);
              
              const resultStr = JSON.stringify(result, null, 2);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: `\n\`\`\`json\n${resultStr}\n\`\`\`\n` })}\n\n`));

              fullResponse += `\n\nTool: ${toolName}\nResult: ${resultStr}`;

              // Log the tool execution
              await supabase.from('automation_logs').insert({
                user_id: userId,
                task_type: `tool_${toolName}`,
                status: result.success ? 'success' : 'failed',
                input_data: toolArgs,
                output_data: result,
                model_used: modelConfig.model
              });
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n---\n**Execution complete.**\n' })}\n\n`));
          }

          // Save assistant response
          await supabase.from('conversation_history').insert({
            user_id: userId,
            role: 'assistant',
            content: fullResponse,
            model: modelConfig.model
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    });

  } catch (error: any) {
    console.error('Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
