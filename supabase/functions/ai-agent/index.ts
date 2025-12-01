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

    // Check if user has appropriate role (admin or user)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'user']);

    if (roleError || !roleData || roleData.length === 0) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied: Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { prompt, taskType = 'general', model = 'sonar-reasoning-pro' } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    
    // Determine provider and API configuration based on model
    let apiUrl = '';
    let apiKey = '';
    let apiModel = model;
    
    if (model.startsWith('sonar')) {
      // Perplexity models
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      apiKey = Deno.env.get('perplexity_api_key') || '';
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Perplexity API not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (model.startsWith('gpt')) {
      // OpenAI models
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = Deno.env.get('openai_api_key') || '';
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (model.startsWith('gemini')) {
      // Google Gemini models
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
      apiModel = `google/${model}`;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Lovable AI not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (model.startsWith('openrouter')) {
      // OpenRouter models
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = Deno.env.get('openrouter_api_key') || '';
      apiModel = model === 'openrouter-claude' ? 'anthropic/claude-3.5-sonnet' : 'openai/gpt-4';
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenRouter API not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid model selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI request:', { taskType, promptLength: prompt.length, userId, model: apiModel });

    // Define comprehensive tools for all advertised services
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
              extract_type: { type: "string", enum: ["text", "html", "table", "links", "images"], description: "Type of content to extract" }
            },
            required: ["url", "extract_type"]
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
              body: { type: "object", description: "Request payload" }
            },
            required: ["endpoint", "method"]
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
              content_type: { type: "string", enum: ["article", "email", "social_post", "code", "marketing_copy", "blog_post"] },
              topic: { type: "string", description: "Topic or subject for content generation" },
              tone: { type: "string", enum: ["professional", "casual", "technical", "creative", "formal"] },
              length: { type: "string", enum: ["short", "medium", "long"] }
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
              analysis_type: { type: "string", enum: ["statistical", "trend", "comparison", "prediction", "sentiment"] },
              output_format: { type: "string", enum: ["report", "chart", "summary", "detailed"] }
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
              workflow_type: { type: "string", enum: ["email_automation", "data_sync", "report_generation", "task_scheduling", "notification_system"] },
              trigger: { type: "string", description: "What triggers the workflow" },
              actions: { type: "array", items: { type: "string" }, description: "List of actions to perform" },
              schedule: { type: "string", description: "Cron expression or schedule description" }
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
              operation: { type: "string", enum: ["convert", "extract_text", "compress", "merge", "split", "analyze"] },
              output_format: { type: "string", description: "Desired output format" }
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
              operation: { type: "string", enum: ["select", "insert", "update", "delete", "aggregate"] },
              filters: { type: "object", description: "Query filters and conditions" },
              fields: { type: "array", items: { type: "string" }, description: "Fields to operate on" }
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
              style: { type: "string", enum: ["realistic", "artistic", "logo", "illustration", "photo"] },
              dimensions: { type: "string", description: "Image dimensions (e.g., 1024x1024)" }
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
              attachments: { type: "array", items: { type: "string" }, description: "File paths for attachments" }
            },
            required: ["to", "subject", "body"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "chatbot_responder",
          description: "Generate intelligent responses for customer support chatbots and conversational AI.",
          parameters: {
            type: "object",
            properties: {
              user_message: { type: "string", description: "User's message or query" },
              context: { type: "object", description: "Conversation context and history" },
              intent: { type: "string", description: "Detected intent of the message" },
              knowledge_base: { type: "string", description: "Knowledge base to reference" }
            },
            required: ["user_message"]
          }
        }
      }
    ];

    // Create log entry
    const logEntry = {
      user_id: userId,
      task_type: taskType,
      status: 'processing',
      input_data: { prompt, taskType, model: apiModel },
      model_used: apiModel,
    };

    const { data: logData } = await supabase
      .from('automation_logs')
      .insert(logEntry)
      .select()
      .single();

    const logId = logData?.id;

    try {
      // Call AI API with comprehensive tools
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            {
              role: 'system',
              content: `You are an advanced Admin Automation Agent with comprehensive capabilities:

**AI Agents & Conversational AI:**
- Customer support chatbots with natural language understanding
- Sales assistant agents for lead qualification and conversion
- Content generation tools for marketing and communication
- Data analysis agents for insights and reporting
- Personal assistant AI for task management and scheduling

**Automation Solutions:**
- Business process automation and workflow optimization
- API integration and development for seamless data exchange
- Data processing and analytics with real-time insights
- Custom automation tools tailored to specific needs
- Legacy system integration and modernization

**App Development:**
- Cross-platform mobile and web application development
- React Native, Flutter, and modern web technologies
- High-performance, secure applications
- User-centric design and intuitive interfaces

**Website Development:**
- Custom responsive website design and development
- E-commerce stores with payment processing
- SEO-optimized sites with fast performance
- Content management systems and blogs
- Landing pages and portfolio sites

**Available Tools:**
You have access to 10 powerful tools to execute tasks:
1. web_scraper - Extract data from any website
2. api_integration - Connect to external services and APIs
3. content_generator - Create articles, emails, posts, code
4. data_analyzer - Analyze data and generate insights
5. workflow_automator - Create automated business processes
6. file_processor - Handle documents, PDFs, images
7. database_query - Manage database operations
8. image_generator - Create AI-generated images
9. email_sender - Send automated emails
10. chatbot_responder - Generate intelligent chat responses

**Your Approach:**
1. Analyze the user's request and identify the best tool(s) to use
2. Break complex tasks into steps using multiple tools if needed
3. Provide clear explanations of what you're doing
4. Return actionable results with implementation details
5. Suggest improvements and optimizations

Always use the appropriate tool for the task. Provide detailed, step-by-step execution plans.`
            },
            { role: 'user', content: prompt }
          ],
          tools: tools,
          tool_choice: "auto",
          temperature: 0.2,
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
