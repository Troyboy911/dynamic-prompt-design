import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperConfig {
  targets?: string[];
  fields?: string[];
  selectors?: Record<string, string>;
  email_report?: boolean;
  report_format?: string;
  max_pages?: number;
  rate_limit?: number;
}

interface ScrapeResult {
  url: string;
  data: Record<string, any>[];
  scraped_at: string;
  items_found: number;
}

async function scrapeUrl(url: string, config: ScraperConfig): Promise<ScrapeResult> {
  console.log(`Scraping: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract basic data from HTML
    const extractedData: Record<string, any>[] = [];
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract headings
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const headings = Array.from(h1Matches).map(m => m[1].trim()).slice(0, 10);
    
    // Extract links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi);
    const links = Array.from(linkMatches).map(m => ({ url: m[1], text: m[2].trim() })).slice(0, 50);
    
    // Extract images
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
    const images = Array.from(imgMatches).map(m => m[1]).slice(0, 20);
    
    // Extract prices (common patterns)
    const priceMatches = html.matchAll(/\$[\d,]+\.?\d*/g);
    const prices = Array.from(priceMatches).map(m => m[0]).slice(0, 20);

    extractedData.push({
      title,
      description,
      headings,
      links_count: links.length,
      sample_links: links.slice(0, 10),
      images_count: images.length,
      sample_images: images.slice(0, 5),
      prices_found: prices.slice(0, 10),
      html_length: html.length,
    });

    return {
      url,
      data: extractedData,
      scraped_at: new Date().toISOString(),
      items_found: extractedData.length,
    };
  } catch (error: any) {
    console.error(`Error scraping ${url}:`, error.message);
    return {
      url,
      data: [{ error: error.message }],
      scraped_at: new Date().toISOString(),
      items_found: 0,
    };
  }
}

function generateHtmlReport(scraperName: string, results: ScrapeResult[]): string {
  const successCount = results.filter(r => r.items_found > 0).length;
  const totalItems = results.reduce((sum, r) => sum + r.items_found, 0);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Scraper Report: ${scraperName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #e5e5e5; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0066CC, #004499); padding: 30px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: white; font-size: 24px; }
    .header p { margin: 10px 0 0; color: rgba(255,255,255,0.8); }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat { background: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #333; }
    .stat-value { font-size: 28px; font-weight: bold; color: #00d4ff; }
    .stat-label { color: #888; margin-top: 5px; font-size: 12px; text-transform: uppercase; }
    .result { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
    .result-header { background: #222; padding: 15px; border-bottom: 1px solid #333; }
    .result-url { color: #00d4ff; word-break: break-all; font-size: 14px; }
    .result-body { padding: 15px; }
    .data-item { margin-bottom: 10px; }
    .data-label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 3px; }
    .data-value { color: #e5e5e5; }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${scraperName} Report</h1>
      <p>Generated at ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">URLs Scraped</div>
      </div>
      <div class="stat">
        <div class="stat-value">${successCount}</div>
        <div class="stat-label">Successful</div>
      </div>
      <div class="stat">
        <div class="stat-value">${totalItems}</div>
        <div class="stat-label">Items Found</div>
      </div>
    </div>
    
    ${results.map(result => `
      <div class="result">
        <div class="result-header">
          <div class="result-url">${result.url}</div>
          <div class="${result.items_found > 0 ? 'success' : 'error'}">
            ${result.items_found > 0 ? `✓ ${result.items_found} items found` : '✗ Failed'}
          </div>
        </div>
        <div class="result-body">
          ${result.data.map(item => `
            ${item.error ? `<div class="error">Error: ${item.error}</div>` : `
              ${item.title ? `<div class="data-item"><div class="data-label">Title</div><div class="data-value">${item.title}</div></div>` : ''}
              ${item.description ? `<div class="data-item"><div class="data-label">Description</div><div class="data-value">${item.description}</div></div>` : ''}
              ${item.headings?.length ? `<div class="data-item"><div class="data-label">Headings</div><div class="data-value">${item.headings.join(', ')}</div></div>` : ''}
              ${item.prices_found?.length ? `<div class="data-item"><div class="data-label">Prices Found</div><div class="data-value">${item.prices_found.join(', ')}</div></div>` : ''}
              ${item.links_count ? `<div class="data-item"><div class="data-label">Links</div><div class="data-value">${item.links_count} links found</div></div>` : ''}
              ${item.images_count ? `<div class="data-item"><div class="data-label">Images</div><div class="data-value">${item.images_count} images found</div></div>` : ''}
            `}
          `).join('')}
        </div>
      </div>
    `).join('')}
    
    <div class="footer">
      Powered by Stellarc Dynamics | <a href="https://stellarcdynamics.com" style="color: #00d4ff;">stellarcdynamics.com</a>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendEmailReport(email: string, subject: string, htmlContent: string, resendApiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Stellarc Dynamics <noreply@stellarcdynamics.com>',
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send error:', error);
      return false;
    }

    console.log('Email sent successfully to:', email);
    return true;
  } catch (error: any) {
    console.error('Email send error:', error.message);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('resend_api_key');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { scraperId, customTargets, sendEmail } = await req.json();

    if (!scraperId) {
      return new Response(JSON.stringify({ error: 'scraperId is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get scraper config
    const { data: scraper, error: scraperError } = await supabase
      .from('scrapers')
      .select('*')
      .eq('id', scraperId)
      .single();

    if (scraperError || !scraper) {
      return new Response(JSON.stringify({ error: 'Scraper not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const config = scraper.config as ScraperConfig;
    const targets = customTargets || config.targets || [];

    if (targets.length === 0) {
      return new Response(JSON.stringify({ error: 'No targets configured for this scraper' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Executing scraper: ${scraper.name} on ${targets.length} targets`);

    // Log the execution
    const { data: log } = await supabase.from('automation_logs').insert({
      user_id: user.id,
      task_type: 'scraper_execution',
      status: 'running',
      input_data: { scraper_id: scraperId, scraper_name: scraper.name, targets },
    }).select().single();

    // Execute scraping
    const results: ScrapeResult[] = [];
    for (const target of targets.slice(0, config.max_pages || 10)) {
      const result = await scrapeUrl(target, config);
      results.push(result);
      
      // Rate limiting
      if (config.rate_limit) {
        await new Promise(resolve => setTimeout(resolve, 1000 / config.rate_limit));
      }
    }

    // Generate report
    const htmlReport = generateHtmlReport(scraper.name, results);
    
    // Send email if requested and configured
    let emailSent = false;
    if ((sendEmail || config.email_report) && resendApiKey) {
      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email) {
        emailSent = await sendEmailReport(
          profile.email,
          `Scraper Report: ${scraper.name} - ${new Date().toLocaleDateString()}`,
          htmlReport,
          resendApiKey
        );
      }
    }

    // Update log with results
    await supabase.from('automation_logs').update({
      status: 'success',
      output_data: {
        results_count: results.length,
        successful: results.filter(r => r.items_found > 0).length,
        total_items: results.reduce((sum, r) => sum + r.items_found, 0),
        email_sent: emailSent,
      },
      execution_time_ms: Date.now() - new Date(log?.created_at || Date.now()).getTime(),
    }).eq('id', log?.id);

    return new Response(JSON.stringify({
      success: true,
      scraper: scraper.name,
      results,
      email_sent: emailSent,
      report_html: htmlReport,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Scraper execution error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
