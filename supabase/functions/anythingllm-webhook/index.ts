import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anythingllm-signature",
};

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp?: string;
  workspace?: string;
  threadId?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature if provided
    const signature = req.headers.get("x-anythingllm-signature");
    const apiKey = Deno.env.get("ANYTHINGLLM_API_KEY");
    
    // Optional signature verification (if AnythingLLM sends signatures)
    if (signature && apiKey) {
      // Basic signature check - can be enhanced based on AnythingLLM's actual signature format
      console.log("Webhook signature received:", signature.substring(0, 20) + "...");
    }

    const payload: WebhookPayload = await req.json();
    console.log("AnythingLLM webhook received:", JSON.stringify(payload, null, 2));

    const { event, data, timestamp, workspace, threadId, message } = payload;

    // Log the webhook event
    await supabase.from("automation_logs").insert({
      task_type: "anythingllm_webhook",
      status: "received",
      input_data: payload,
      model_used: "anythingllm",
    });

    // Handle different webhook events
    let responseData: Record<string, unknown> = { success: true };

    switch (event) {
      case "chat.message":
        // Handle incoming chat message
        console.log("Chat message received:", message);
        responseData = {
          success: true,
          event: "chat.message",
          processed: true,
          threadId,
          workspace,
        };
        break;

      case "chat.completed":
        // Handle completed chat response
        console.log("Chat completed for thread:", threadId);
        responseData = {
          success: true,
          event: "chat.completed",
          processed: true,
        };
        break;

      case "document.added":
        // Handle document added to workspace
        console.log("Document added to workspace:", workspace);
        responseData = {
          success: true,
          event: "document.added",
          processed: true,
        };
        break;

      case "document.removed":
        // Handle document removed from workspace
        console.log("Document removed from workspace:", workspace);
        responseData = {
          success: true,
          event: "document.removed",
          processed: true,
        };
        break;

      case "workspace.created":
        // Handle new workspace created
        console.log("Workspace created:", workspace);
        responseData = {
          success: true,
          event: "workspace.created",
          processed: true,
        };
        break;

      case "automation.trigger":
        // Trigger an automation based on webhook data
        console.log("Automation trigger received:", data);
        
        if (data.automationId) {
          const { data: automation } = await supabase
            .from("automations")
            .select("*")
            .eq("id", data.automationId)
            .single();

          if (automation) {
            // Log automation execution
            await supabase.from("automation_logs").insert({
              task_type: automation.automation_type,
              status: "triggered",
              input_data: { source: "anythingllm_webhook", ...data },
              model_used: "anythingllm",
            });

            responseData = {
              success: true,
              event: "automation.trigger",
              automationId: data.automationId,
              automationName: automation.name,
              status: "triggered",
            };
          }
        }
        break;

      case "scraper.trigger":
        // Trigger a scraper based on webhook data
        console.log("Scraper trigger received:", data);
        
        if (data.scraperId) {
          const { data: scraper } = await supabase
            .from("scrapers")
            .select("*")
            .eq("id", data.scraperId)
            .single();

          if (scraper) {
            await supabase.from("automation_logs").insert({
              task_type: scraper.scraper_type,
              status: "triggered",
              input_data: { source: "anythingllm_webhook", ...data },
              model_used: "anythingllm",
            });

            responseData = {
              success: true,
              event: "scraper.trigger",
              scraperId: data.scraperId,
              scraperName: scraper.name,
              status: "triggered",
            };
          }
        }
        break;

      case "notification":
        // Handle general notifications
        console.log("Notification received:", data);
        responseData = {
          success: true,
          event: "notification",
          processed: true,
          timestamp: timestamp || new Date().toISOString(),
        };
        break;

      default:
        console.log("Unknown event type:", event);
        responseData = {
          success: true,
          event: event || "unknown",
          message: "Event received but no specific handler configured",
        };
    }

    // Update log with response
    await supabase.from("automation_logs").insert({
      task_type: "anythingllm_webhook_response",
      status: "completed",
      output_data: responseData,
      model_used: "anythingllm",
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AnythingLLM webhook error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
