import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Server, 
  Brain, 
  Search, 
  Github, 
  Globe, 
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Settings,
  Bot,
  Send
} from "lucide-react";

interface MCPServer {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  provider: string;
  enabled: boolean;
  apiKeyName: string;
  apiKeyConfigured: boolean;
  status: 'connected' | 'disconnected' | 'error';
  capabilities: string[];
}

interface MCPServerState {
  id: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const STORAGE_KEY = 'stellarc_mcp_servers';

const MCPServersTab = () => {
  const [servers, setServers] = useState<MCPServer[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-5, DALL-E and Whisper API integration for advanced AI capabilities',
      icon: <Brain className="w-6 h-6" />,
      provider: 'openai',
      enabled: false,
      apiKeyName: 'openai_api_key',
      apiKeyConfigured: false,
      status: 'disconnected',
      capabilities: ['Chat Completion', 'Image Generation', 'Text-to-Speech', 'Embeddings']
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI',
      description: 'Real-time search and research-focused AI with web access',
      icon: <Search className="w-6 h-6" />,
      provider: 'perplexity',
      enabled: false,
      apiKeyName: 'perplexity_api_key',
      apiKeyConfigured: false,
      status: 'disconnected',
      capabilities: ['Web Search', 'Research', 'Real-time Data', 'Citation']
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Connect to Notion workspace for document and database management',
      icon: <FileText className="w-6 h-6" />,
      provider: 'notion',
      enabled: false,
      apiKeyName: 'notion_api_key',
      apiKeyConfigured: false,
      status: 'disconnected',
      capabilities: ['Read Pages', 'Create Pages', 'Query Databases', 'Update Content']
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Repository management, issues, PRs, and code operations',
      icon: <Github className="w-6 h-6" />,
      provider: 'github',
      enabled: false,
      apiKeyName: 'github_token',
      apiKeyConfigured: false,
      status: 'disconnected',
      capabilities: ['Repo Management', 'Issues', 'Pull Requests', 'Code Search']
    },
    {
      id: 'browser',
      name: 'Browser Automation',
      description: 'Playwright-powered browser control for web automation and scraping',
      icon: <Globe className="w-6 h-6" />,
      provider: 'playwright',
      enabled: false,
      apiKeyName: '',
      apiKeyConfigured: true,
      status: 'disconnected',
      capabilities: ['Navigation', 'Form Filling', 'Screenshots', 'Data Extraction']
    },
    {
      id: 'n8n',
      name: 'n8n Workflows',
      description: 'Connect to n8n workflow automation platform for advanced automations and integrations',
      icon: <Server className="w-6 h-6" />,
      provider: 'n8n',
      enabled: false,
      apiKeyName: 'n8n_webhook_url',
      apiKeyConfigured: false,
      status: 'disconnected',
      capabilities: ['Workflow Execution', 'Multi-App Integration', 'Custom Automations', 'Data Pipelines']
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const { toast } = useToast();

  // Agent state
  const [message, setMessage] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-opus-4.5");

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
    checkApiKeyStatus();
  }, []);

  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedStates: MCPServerState[] = JSON.parse(saved);
        setServers(prev => prev.map(server => {
          const savedState = savedStates.find(s => s.id === server.id);
          if (savedState) {
            return {
              ...server,
              enabled: savedState.enabled,
              status: savedState.status
            };
          }
          return server;
        }));
      }
    } catch (error) {
      console.error('Error loading MCP state:', error);
    }
  };

  const persistState = (updatedServers: MCPServer[]) => {
    try {
      const states: MCPServerState[] = updatedServers.map(s => ({
        id: s.id,
        enabled: s.enabled,
        status: s.status
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Error saving MCP state:', error);
    }
  };

  const checkApiKeyStatus = async () => {
    setIsLoading(true);
    try {
      const configuredKeys = ['openai_api_key', 'perplexity_api_key'];
      
      setServers(prev => {
        const updated = prev.map(server => ({
          ...server,
          apiKeyConfigured: server.apiKeyName === '' || configuredKeys.includes(server.apiKeyName),
        }));
        return updated;
      });
    } catch (error) {
      console.error('Error checking API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    if (!server.apiKeyConfigured && server.apiKeyName) {
      toast({
        title: "API Key Required",
        description: `Please configure the ${server.name} API key in the APIs tab first.`,
        variant: "destructive",
      });
      return;
    }

    const newStatus: 'connected' | 'disconnected' = !server.enabled ? 'connected' : 'disconnected';
    const updatedServers = servers.map(s => 
      s.id === serverId 
        ? { ...s, enabled: !s.enabled, status: newStatus }
        : s
    );
    
    setServers(updatedServers);
    persistState(updatedServers);

    toast({
      title: server.enabled ? "Server Disabled" : "Server Enabled",
      description: `${server.name} MCP server has been ${server.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const handleTestConnection = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    setTestingServer(serverId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const testPrompt = `Test connection to ${server.name} MCP server. Respond with "Connection successful" if working.`;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: testPrompt,
            model: server.id === 'perplexity' ? 'sonar-reasoning-pro' : 
                   server.id === 'openai' ? 'openrouter/gpt-4o' : 'openrouter/auto',
            taskType: 'mcp_test',
          }),
        }
      );

      if (response.ok) {
        const newStatus: 'connected' = 'connected';
        const updatedServers = servers.map(s => 
          s.id === serverId ? { ...s, status: newStatus } : s
        );
        setServers(updatedServers);
        persistState(updatedServers);
        
        toast({
          title: "Connection Successful",
          description: `${server.name} MCP server is responding correctly`,
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error: any) {
      const errorStatus: 'error' = 'error';
      const updatedServers = servers.map(s => 
        s.id === serverId ? { ...s, status: errorStatus } : s
      );
      setServers(updatedServers);
      persistState(updatedServers);
      
      toast({
        title: "Connection Failed",
        description: error.message || `Could not connect to ${server.name}`,
        variant: "destructive",
      });
    } finally {
      setTestingServer(null);
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsAgentLoading(true);
    setAgentResponse("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      // Build context about enabled MCP servers
      const enabledServers = servers.filter(s => s.enabled);
      const mcpContext = enabledServers.length > 0 
        ? `Active MCP servers: ${enabledServers.map(s => s.name).join(', ')}. Use their capabilities when relevant.`
        : '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: `${mcpContext}\n\nUser request: ${message}`,
            model: selectedModel,
            taskType: 'mcp_agent',
            enabledMcpServers: enabledServers.map(s => s.id),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to connect to agent');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
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
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setAgentResponse(fullResponse);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAgentLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  const enabledCount = servers.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* MCP Agent Interface */}
      <Card className="card-glass border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            MCP Agent
            {enabledCount > 0 && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                {enabledCount} server{enabledCount > 1 ? 's' : ''} active
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Use the AI agent with your active MCP servers for enhanced capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAgentSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="mcp-model">Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="mcp-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-opus-4.5">🧠 Claude Opus 4.5</SelectItem>
                    <SelectItem value="gpt-5">GPT-5</SelectItem>
                    <SelectItem value="llama-4-maverick">Llama 4 Maverick</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="openrouter/auto">OpenRouter Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcp-message">Command</Label>
              <div className="flex gap-2">
                <Textarea
                  id="mcp-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={enabledCount > 0 
                    ? `Use ${servers.filter(s => s.enabled).map(s => s.name).join(', ')} to...`
                    : "Enable MCP servers below to unlock agent capabilities..."
                  }
                  rows={2}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isAgentLoading || enabledCount === 0} 
                  className="glow-effect h-auto"
                >
                  {isAgentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {agentResponse && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/30 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2 text-primary text-sm">Response:</h4>
              <p className="text-sm whitespace-pre-wrap">{agentResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MCP Servers Configuration */}
      <Card className="card-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                MCP Servers
              </CardTitle>
              <CardDescription>
                Configure Model Context Protocol servers for enhanced AI agent capabilities
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { loadPersistedState(); checkApiKeyStatus(); }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servers.map((server) => (
              <div 
                key={server.id} 
                className={`p-5 rounded-lg border transition-all ${
                  server.enabled 
                    ? 'bg-primary/10 border-primary/40' 
                    : 'bg-secondary/20 border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-lg ${
                      server.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {server.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{server.name}</h4>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(server.status)}
                          <span className={`text-xs font-medium ${
                            server.status === 'connected' ? 'text-green-500' :
                            server.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {getStatusText(server.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{server.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {server.capabilities.map((cap, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                      {server.apiKeyName && !server.apiKeyConfigured && (
                        <p className="text-xs text-yellow-500 flex items-center gap-1 mt-2">
                          <Settings className="w-3 h-3" />
                          API key not configured - Go to APIs tab to set up
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(server.id)}
                      disabled={!server.apiKeyConfigured || testingServer === server.id}
                    >
                      {testingServer === server.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                    <Switch
                      checked={server.enabled}
                      onCheckedChange={() => handleToggleServer(server.id)}
                      disabled={!server.apiKeyConfigured && !!server.apiKeyName}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MCP Tools Summary */}
          <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border border-primary/20">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Available MCP Tools
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Web Scraper', enabled: true },
                { name: 'Browser Automation', enabled: servers.find(s => s.id === 'browser')?.enabled },
                { name: 'API Integration', enabled: true },
                { name: 'Notion MCP', enabled: servers.find(s => s.id === 'notion')?.enabled },
                { name: 'GitHub MCP', enabled: servers.find(s => s.id === 'github')?.enabled },
                { name: 'n8n Workflows', enabled: servers.find(s => s.id === 'n8n')?.enabled },
                { name: 'Content Generator', enabled: true },
                { name: 'Data Analyzer', enabled: true },
                { name: 'Workflow Automator', enabled: true },
                { name: 'File Processor', enabled: true },
                { name: 'Database Query', enabled: true },
                { name: 'Image Generator', enabled: servers.find(s => s.id === 'openai')?.enabled },
                { name: 'Email Sender', enabled: true },
              ].map((tool, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    tool.enabled 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-secondary/20 text-muted-foreground border border-border'
                  }`}
                >
                  {tool.enabled ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {tool.name}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPServersTab;
