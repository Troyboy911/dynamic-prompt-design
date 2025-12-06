import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter available models
const OPENROUTER_MODELS = {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role - AI agent is admin-only
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin access verified for user:', user.id);

    const userId = user.id;
    const { prompt, taskType = 'general', model = 'openrouter/auto', automationConfig } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    
    // Default to OpenRouter for all requests
    let apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    let apiKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('openrouter_api_key') || '';
    let apiModel = OPENROUTER_MODELS[model] || OPENROUTER_MODELS['openrouter/auto'] || 'openrouter/auto';
    
    // Fallback to other providers if OpenRouter not configured
    if (!apiKey) {
      if (model.startsWith('sonar')) {
        apiUrl = 'https://api.perplexity.ai/chat/completions';
        apiKey = Deno.env.get('perplexity_api_key') || '';
        apiModel = model;
      } else if (model.startsWith('gpt')) {
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
        JSON.stringify({ error: 'No AI service configured. Please add OPENROUTER_API_KEY or LOVABLE_API_KEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI request:', { taskType, promptLength: prompt.length, userId, model: apiModel });

    // Define comprehensive tools including MCP-style connections
    const tools = [
      {
        type: "function",
        function: {
          name: "web_scraper",
          description: "Extract data from websites including text, tables, links, and structured content. Supports pagination and dynamic content loading.",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to scrape" },
              selectors: { type: "array", items: { type: "string" }, description: "CSS selectors for specific elements" },
              extract_type: { type: "string", enum: ["text", "html", "table", "links", "images", "all"], description: "Type of content to extract" },
              pagination: { type: "boolean", description: "Whether to handle pagination" },
              wait_for: { type: "string", description: "CSS selector to wait for before extracting" }
            },
            required: ["url", "extract_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "browser_automation",
          description: "Control browser via Playwright for navigation, form filling, clicking, screenshots, and complex interactions.",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["navigate", "click", "type", "screenshot", "scroll", "wait", "extract", "fill_form"] },
              url: { type: "string", description: "URL to navigate to" },
              selector: { type: "string", description: "CSS selector for element" },
              value: { type: "string", description: "Value to type or select" },
              options: { type: "object", description: "Additional options for the action" }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "api_integration",
          description: "Connect and interact with external APIs for data exchange, automation, and third-party service integration.",
          parameters: {
            type: "object",
            properties: {
              endpoint: { type: "string", description: "API endpoint URL" },
              method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
              headers: { type: "object", description: "Request headers" },
              body: { type: "object", description: "Request payload" },
              auth_type: { type: "string", enum: ["none", "bearer", "api_key", "basic", "oauth2"] }
            },
            required: ["endpoint", "method"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "mcp_notion",
          description: "Connect to Notion workspace via MCP to read/write pages, databases, and blocks.",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["search", "fetch_page", "create_page", "update_page", "query_database", "create_database_entry"] },
              query: { type: "string", description: "Search query or page ID" },
              database_id: { type: "string", description: "Notion database ID" },
              content: { type: "object", description: "Content to create or update" },
              properties: { type: "object", description: "Page or entry properties" }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "mcp_github",
          description: "Connect to GitHub via MCP for repository operations, issues, PRs, and code management.",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["list_repos", "get_repo", "create_issue", "list_issues", "create_pr", "get_file", "commit_file"] },
              repo: { type: "string", description: "Repository name (owner/repo)" },
              path: { type: "string", description: "File path in repository" },
              content: { type: "string", description: "Content for file or issue/PR body" },
              title: { type: "string", description: "Title for issue or PR" }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "mcp_slack",
          description: "Connect to Slack via MCP for messaging, channel management, and notifications.",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["send_message", "list_channels", "search_messages", "create_channel", "upload_file"] },
              channel: { type: "string", description: "Channel ID or name" },
              message: { type: "string", description: "Message content" },
              query: { type: "string", description: "Search query" }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "content_generator",
          description: "Generate various types of content including articles, social media posts, emails, code, and marketing copy.",
          parameters: {
            type: "object",
            properties: {
              content_type: { type: "string", enum: ["article", "email", "social_post", "code", "marketing_copy", "blog_post", "script", "documentation"] },
              topic: { type: "string", description: "Topic or subject for content generation" },
              tone: { type: "string", enum: ["professional", "casual", "technical", "creative", "formal", "friendly"] },
              length: { type: "string", enum: ["short", "medium", "long", "custom"] },
              format: { type: "string", description: "Output format (markdown, html, plain)" }
            },
            required: ["content_type", "topic"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "data_analyzer",
          description: "Analyze datasets, extract insights, generate reports, and visualize data trends.",
          parameters: {
            type: "object",
            properties: {
              data_source: { type: "string", description: "Source of data (file path, database query, API)" },
              analysis_type: { type: "string", enum: ["statistical", "trend", "comparison", "prediction", "sentiment", "clustering", "anomaly"] },
              output_format: { type: "string", enum: ["report", "chart", "summary", "detailed", "json", "csv"] },
              metrics: { type: "array", items: { type: "string" }, description: "Specific metrics to calculate" }
            },
            required: ["data_source", "analysis_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "workflow_automator",
          description: "Create and execute automated workflows for business processes, task scheduling, and system integration.",
          parameters: {
            type: "object",
            properties: {
              workflow_type: { type: "string", enum: ["email_automation", "data_sync", "report_generation", "task_scheduling", "notification_system", "lead_nurturing", "data_pipeline"] },
              trigger: { type: "string", description: "What triggers the workflow" },
              actions: { type: "array", items: { type: "string" }, description: "List of actions to perform" },
              schedule: { type: "string", description: "Cron expression or schedule description" },
              conditions: { type: "object", description: "Conditional logic for workflow" }
            },
            required: ["workflow_type", "actions"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "file_processor",
          description: "Process, convert, and manipulate files including PDFs, images, documents, and spreadsheets.",
          parameters: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "Path to the file" },
              operation: { type: "string", enum: ["convert", "extract_text", "compress", "merge", "split", "analyze", "ocr", "watermark"] },
              output_format: { type: "string", description: "Desired output format" },
              options: { type: "object", description: "Operation-specific options" }
            },
            required: ["file_path", "operation"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "database_query",
          description: "Query and manipulate database records for data retrieval and management.",
          parameters: {
            type: "object",
            properties: {
              table: { type: "string", description: "Database table name" },
              operation: { type: "string", enum: ["select", "insert", "update", "delete", "aggregate", "join", "raw_sql"] },
              filters: { type: "object", description: "Query filters and conditions" },
              fields: { type: "array", items: { type: "string" }, description: "Fields to operate on" },
              order_by: { type: "string", description: "Field to order results by" },
              limit: { type: "number", description: "Maximum results to return" }
            },
            required: ["table", "operation"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "image_generator",
          description: "Generate, edit, and manipulate images using AI.",
          parameters: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Description of the image to generate" },
              style: { type: "string", enum: ["realistic", "artistic", "logo", "illustration", "photo", "3d", "anime"] },
              dimensions: { type: "string", description: "Image dimensions (e.g., 1024x1024)" },
              model: { type: "string", description: "Image model to use" }
            },
            required: ["prompt"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "email_sender",
          description: "Send automated emails with templates, attachments, and scheduling.",
          parameters: {
            type: "object",
            properties: {
              to: { type: "array", items: { type: "string" }, description: "Recipient email addresses" },
              subject: { type: "string", description: "Email subject line" },
              body: { type: "string", description: "Email content" },
              template: { type: "string", description: "Email template name" },
              attachments: { type: "array", items: { type: "string" }, description: "File paths for attachments" },
              schedule: { type: "string", description: "When to send (ISO datetime or 'now')" }
            },
            required: ["to", "subject", "body"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_user_input",
          description: "Ask the user for required information that is missing to complete the task.",
          parameters: {
            type: "object",
            properties: {
              question: { type: "string", description: "The question to ask the user" },
              input_type: { type: "string", enum: ["text", "number", "url", "email", "file", "selection", "confirmation"], description: "Type of input expected" },
              options: { type: "array", items: { type: "string" }, description: "Options for selection type" },
              required: { type: "boolean", description: "Whether this input is required" },
              default_value: { type: "string", description: "Default value if user skips" }
            },
            required: ["question", "input_type"]
          }
        }
      }
    ];

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

    // Create log entry
    const logEntry = {
      user_id: userId,
      task_type: taskType,
      status: 'processing',
      input_data: { prompt, taskType, model: apiModel, automationConfig },
      model_used: apiModel,
    };

    const { data: logData } = await supabase
      .from('automation_logs')
      .insert(logEntry)
      .select()
      .single();

    const logId = logData?.id;

    // Enhanced system prompt
    const systemPrompt = `You are an advanced Admin Automation Agent for Stellarc Dynamics with comprehensive capabilities.

**CRITICAL INSTRUCTIONS:**
1. ALWAYS follow the exact instructions provided in automation configurations
2. If you need ANY information to complete a task that wasn't provided, you MUST use the "request_user_input" tool to ask the user
3. Do NOT make assumptions about missing data - always ask
4. Execute tasks step-by-step and report progress
5. If an automation has specific steps defined, follow them in order

${automationContext}

**AVAILABLE CAPABILITIES:**

**Web & Browser Automation:**
- web_scraper: Extract data from any website (text, tables, links, images)
- browser_automation: Full Playwright browser control (navigate, click, type, screenshot, forms)

**MCP Server Connections:**
- mcp_notion: Read/write Notion pages, databases, and blocks
- mcp_github: Repository operations, issues, PRs, code management
- mcp_slack: Messaging, channels, notifications

**Content & Data:**
- content_generator: Create articles, emails, social posts, code, documentation
- data_analyzer: Statistical analysis, trends, predictions, sentiment analysis
- file_processor: PDF, image, document conversion and manipulation

**Integrations:**
- api_integration: Connect to any REST API with auth support
- database_query: Query and manipulate database records
- email_sender: Automated email campaigns with templates
- workflow_automator: Create automated business processes

**Image Generation:**
- image_generator: AI-powered image creation and editing

**User Interaction:**
- request_user_input: Ask user for missing information (ALWAYS use this when data is missing)

**YOUR APPROACH:**
1. Analyze the request and identify ALL required information
2. If ANY information is missing, use request_user_input to ask the user
3. Break complex tasks into steps
4. Use appropriate tools for each step
5. Report results clearly with actionable details
6. Suggest optimizations and next steps

REMEMBER: Never proceed with incomplete information. Always ask the user for clarification when needed.`;

    try {
      // Call AI API with comprehensive tools
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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          tools: tools,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      const toolCalls = data.choices[0].message.tool_calls || [];
      const executionTime = Date.now() - startTime;

      // Update log with success
      if (logId) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'success',
            output_data: { result, model: apiModel, tool_calls: toolCalls },
            execution_time_ms: executionTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      console.log('AI request completed successfully:', { executionTime, logId, toolCallsCount: toolCalls.length });

      return new Response(
        JSON.stringify({ 
          result, 
          executionTime,
          logId,
          model: apiModel,
          toolCalls
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
