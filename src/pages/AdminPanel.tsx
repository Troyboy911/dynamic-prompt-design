import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Bot, Upload, Settings, FileText, Loader2, Users, Shield, Plus, Megaphone, Wrench, X, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EmailCampaignsTab from "@/components/admin/EmailCampaignsTab";

interface AutomationLog {
  id: string;
  task_type: string;
  status: string;
  input_data: any;
  output_data: any;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
}

interface UserWithRoles {
  user_id: string;
  email: string;
  roles: string[];
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
}

interface Scraper {
  id: string;
  name: string;
  description?: string;
  scraper_type: string;
  config?: any;
  status: string;
  created_at: string;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  automation_type: string;
  config?: any;
  status: string;
  created_at: string;
}

interface PlaygroundTool {
  id: string;
  name: string;
  description?: string;
  tool_type: string;
  config?: any;
  airtable_synced: boolean;
  airtable_record_id?: string;
  created_at: string;
}

interface AdvertiseAutomation {
  id: string;
  name: string;
  description?: string;
  automation_type: string;
  config?: any;
  status: string;
  created_at: string;
}

const AdminPanel = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [agentResponse, setAgentResponse] = useState("");
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sonar-reasoning-pro");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [playgroundTools, setPlaygroundTools] = useState<PlaygroundTool[]>([]);
  const [advertiseAutomations, setAdvertiseAutomations] = useState<AdvertiseAutomation[]>([]);
  const [showToolBuilder, setShowToolBuilder] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', description: '', tool_type: 'custom', config: '{}' });
  const [isSavingTool, setIsSavingTool] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let subscription: any;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      // Verify admin role
      const { data: roleData } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      fetchLogs();
      fetchConversationHistory();
      fetchScrapers();
      fetchAutomations();
      fetchPlaygroundTools();
      fetchAdvertiseAutomations();
    };

    // Set up auth state listener
    subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/admin");
      }
    });

    checkAuth();

    return () => {
      subscription?.data?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setLogs(data);
    }
  };

  const fetchConversationHistory = async () => {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setConversationHistory(data as ConversationMessage[]);
    }
  };

  const fetchScrapers = async () => {
    const { data, error } = await supabase
      .from('scrapers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setScrapers(data);
    }
  };

  const fetchAutomations = async () => {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAutomations(data);
    }
  };

  const fetchPlaygroundTools = async () => {
    const { data, error } = await supabase
      .from('playground_tools')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPlaygroundTools(data);
    }
  };

  const fetchAdvertiseAutomations = async () => {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('category', 'advertise')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAdvertiseAutomations(data);
    }
  };

  const handleCreateTool = async () => {
    if (!newTool.name.trim()) {
      toast({
        title: "Error",
        description: "Tool name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTool(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(newTool.config);
      } catch {
        parsedConfig = {};
      }

      const { error } = await supabase
        .from('playground_tools')
        .insert({
          user_id: session.user.id,
          name: newTool.name,
          description: newTool.description,
          tool_type: newTool.tool_type,
          config: parsedConfig,
        });

      if (error) throw error;

      toast({
        title: "Tool Created",
        description: `${newTool.name} has been added to your playground`,
      });

      setNewTool({ name: '', description: '', tool_type: 'custom', config: '{}' });
      setShowToolBuilder(false);
      fetchPlaygroundTools();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingTool(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-users-with-roles');

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'moderator' | 'user', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;
        
        toast({
          title: "Role Added",
          description: `${role} role added successfully`,
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        
        if (error) throw error;
        
        toast({
          title: "Role Removed",
          description: `${role} role removed successfully`,
        });
      }
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAgentResponse("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }
      
      // Use streaming endpoint with user's JWT token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: message,
            model: selectedModel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

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
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      toast({
        title: "AI Agent Response",
        description: `Completed using ${selectedModel}`,
      });
      
      await fetchLogs();
      await fetchConversationHistory();
      setMessage("");
    } catch (error: any) {
      console.error('AI Agent error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} ready for upload`,
      });
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'admin-temp';
      
      const filePath = `${userId}/${Date.now()}-${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agent-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save metadata
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .insert({
          user_id: session?.user?.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        });

      if (metadataError) throw metadataError;

      toast({
        title: "File Uploaded",
        description: `${selectedFile.name} uploaded successfully`,
      });
      
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 hero-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-glow">Stellarc Admin Panel</h1>
            <p className="text-muted-foreground">Manage your website with AI assistance</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-primary/50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="scrapers" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Scrapers
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="playground" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Playground
            </TabsTrigger>
            <TabsTrigger value="advertise" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Advertise
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              APIs
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* AI Agent Tab */}
          <TabsContent value="agent">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Website Assistant
                </CardTitle>
                <CardDescription>
                  Use natural language to make changes to your website, add content, or modify settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAgentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-select">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sonar">Perplexity Sonar (Fast)</SelectItem>
                        <SelectItem value="sonar-pro">Perplexity Sonar Pro</SelectItem>
                        <SelectItem value="sonar-reasoning">Perplexity Reasoning</SelectItem>
                        <SelectItem value="sonar-reasoning-pro">Perplexity Reasoning Pro (Default)</SelectItem>
                        <SelectItem value="gpt-5">OpenAI GPT-5</SelectItem>
                        <SelectItem value="gpt-5-mini">OpenAI GPT-5 Mini</SelectItem>
                        <SelectItem value="gpt-4.1">OpenAI GPT-4.1</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Google Gemini 2.5 Pro</SelectItem>
                        <SelectItem value="gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="openrouter-claude">OpenRouter Claude Sonnet</SelectItem>
                        <SelectItem value="openrouter-gpt">OpenRouter GPT-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-message">What would you like to do?</Label>
                    <Textarea
                      id="agent-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Example: 'Change the hero section background color to blue' or 'Add a new service card for consulting' or 'Update the about us text'"
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="glow-effect">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoading ? "Processing..." : "Execute Command"}
                  </Button>
                </form>
                
                {agentResponse && (
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <h4 className="font-semibold mb-2 text-primary">AI Response:</h4>
                    <p className="text-sm whitespace-pre-wrap">{agentResponse}</p>
                  </div>
                )}

                {conversationHistory.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-primary">Conversation History:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {conversationHistory.slice(0, 10).map((msg) => (
                        <div key={msg.id} className={`p-3 rounded text-sm ${msg.role === 'user' ? 'bg-secondary/20' : 'bg-primary/10'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold capitalize">{msg.role}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {logs.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-primary">Recent Activity:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className="p-3 bg-secondary/20 rounded text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{log.task_type}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                              log.status === 'error' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          {log.execution_time_ms && (
                            <p className="text-xs text-muted-foreground">
                              Completed in {log.execution_time_ms}ms
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Campaigns Tab */}
          <TabsContent value="emails">
            <EmailCampaignsTab />
          </TabsContent>

          {/* Scrapers Tab */}
          <TabsContent value="scrapers">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Web Scrapers
                </CardTitle>
                <CardDescription>
                  Manage web scraping tools to extract data from websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scrapers.map((scraper) => (
                    <div key={scraper.id} className="p-4 bg-secondary/20 rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{scraper.name}</h4>
                          <p className="text-sm text-muted-foreground">{scraper.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                              {scraper.scraper_type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              scraper.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {scraper.status}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Automation Workflows
                </CardTitle>
                <CardDescription>
                  Manage automated tasks and workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automations.map((automation) => (
                    <div key={automation.id} className="p-4 bg-secondary/20 rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{automation.name}</h4>
                          <p className="text-sm text-muted-foreground">{automation.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                              {automation.automation_type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              automation.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {automation.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Run
                          </Button>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playground Tab */}
          <TabsContent value="playground">
            <Card className="card-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Tool Playground
                    </CardTitle>
                    <CardDescription>
                      Build, test, and store custom tools. Sync with Airtable for collaborative workflows.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowToolBuilder(!showToolBuilder)} className="glow-effect">
                    {showToolBuilder ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showToolBuilder ? 'Cancel' : 'Create Tool'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tool Builder Form */}
                  {showToolBuilder && (
                    <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/40 space-y-4">
                      <h4 className="font-semibold text-lg text-primary flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Build New Tool
                      </h4>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tool-name">Tool Name *</Label>
                          <Input
                            id="tool-name"
                            value={newTool.name}
                            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                            placeholder="e.g., Content Analyzer, Data Extractor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tool-description">Description</Label>
                          <Textarea
                            id="tool-description"
                            value={newTool.description}
                            onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                            placeholder="Describe what this tool does..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tool-type">Tool Type</Label>
                          <Select value={newTool.tool_type} onValueChange={(v) => setNewTool({ ...newTool, tool_type: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tool type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom</SelectItem>
                              <SelectItem value="scraper">Scraper</SelectItem>
                              <SelectItem value="automation">Automation</SelectItem>
                              <SelectItem value="analyzer">Analyzer</SelectItem>
                              <SelectItem value="generator">Generator</SelectItem>
                              <SelectItem value="processor">Processor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tool-config">Configuration (JSON)</Label>
                          <Textarea
                            id="tool-config"
                            value={newTool.config}
                            onChange={(e) => setNewTool({ ...newTool, config: e.target.value })}
                            placeholder='{"key": "value"}'
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </div>
                        <Button onClick={handleCreateTool} disabled={isSavingTool} className="w-full glow-effect">
                          {isSavingTool && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {isSavingTool ? 'Creating...' : 'Create Tool'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <h4 className="font-semibold mb-2">Playground Features:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Build and test new automation tools</li>
                      <li>Save tools to database for reuse</li>
                      <li>Import tools from Airtable</li>
                      <li>Export tools back to Airtable</li>
                      <li>Webhook triggers for Airtable changes</li>
                    </ul>
                  </div>

                  <h4 className="font-semibold text-primary">Your Tools:</h4>
                  {playgroundTools.length > 0 ? (
                    <div className="space-y-3">
                      {playgroundTools.map((tool) => (
                        <div key={tool.id} className="p-4 bg-secondary/20 rounded-lg border border-border">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                                  {tool.tool_type}
                                </span>
                                {tool.airtable_synced && (
                                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                                    Synced with Airtable
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Test
                              </Button>
                              <Button size="sm" variant="outline">
                                Sync to Airtable
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No tools created yet. Click "Create Tool" to build your first custom tool.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advertise Tab - Admin Only Internal Tools */}
          <TabsContent value="advertise">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Advertise - Internal Protocols
                </CardTitle>
                <CardDescription>
                  Admin-only marketing and social proof automation tools. These are internal protocols not visible to customers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-semibold mb-2 text-yellow-400">⚠️ Internal Use Only</h4>
                    <p className="text-sm text-muted-foreground">
                      These automations are for administrative marketing purposes only. They are not listed in the public marketplace.
                    </p>
                  </div>

                  {advertiseAutomations.length > 0 ? (
                    <div className="space-y-4">
                      {advertiseAutomations.map((automation) => (
                        <div key={automation.id} className="p-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="font-bold text-lg text-orange-400">{automation.name}</h4>
                              <p className="text-sm text-muted-foreground">{automation.description}</p>
                              <div className="flex gap-2 mt-3">
                                <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 font-medium">
                                  {automation.automation_type}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 font-medium">
                                  INTERNAL
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  automation.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {automation.status}
                                </span>
                              </div>
                              {automation.config && (
                                <div className="mt-3 p-3 bg-background/50 rounded text-xs">
                                  <p className="text-muted-foreground mb-1 font-semibold">Phases:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {(automation.config as any).phases?.map((phase: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary rounded">
                                        {phase.replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/40">
                                Configure
                              </Button>
                              <Button size="sm" variant="outline">
                                Run Protocol
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No internal advertising automations configured.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users & Role Management Tab */}
          <TabsContent value="users">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  User Role Management
                </CardTitle>
                <CardDescription>
                  Manage user roles and permissions. Admins can promote/demote users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={fetchUsers} disabled={isLoadingUsers} variant="outline">
                    {isLoadingUsers && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoadingUsers ? "Loading..." : "Refresh Users"}
                  </Button>

                  {users.length > 0 ? (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.user_id} className="p-4 bg-secondary/20 rounded-lg border border-border">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{user.email}</p>
                              <p className="text-xs text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</p>
                              <div className="flex gap-2 mt-2">
                                {user.roles.map((role) => (
                                  <span
                                    key={role}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                      role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-green-500/20 text-green-400'
                                    }`}
                                  >
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!user.roles.includes('admin') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRoleChange(user.user_id, 'admin', 'add')}
                                >
                                  Make Admin
                                </Button>
                              )}
                              {user.roles.includes('admin') && user.roles.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRoleChange(user.user_id, 'admin', 'remove')}
                                >
                                  Remove Admin
                                </Button>
                              )}
                              {!user.roles.includes('moderator') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRoleChange(user.user_id, 'moderator', 'add')}
                                >
                                  Make Moderator
                                </Button>
                              )}
                              {user.roles.includes('moderator') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRoleChange(user.user_id, 'moderator', 'remove')}
                                >
                                  Remove Moderator
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No users found. Click "Refresh Users" to load.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Status Tab */}
          <TabsContent value="apis">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Backend API Status</CardTitle>
                <CardDescription>
                  API keys are securely stored in the backend
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-400">✓ OpenAI API Configured</h4>
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI API key is securely stored and ready for AI agent operations.
                  </p>
                </div>

                <div className="p-4 bg-secondary/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-primary">Secure Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    All API keys are stored securely in the backend and never exposed to the frontend.
                    This prevents unauthorized access and ensures your credentials remain safe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  Upload images, templates, or other files for use on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </div>
                
                {selectedFile && (
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <Button onClick={uploadFile} className="mt-2" size="sm" disabled={isUploading}>
                      {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {isUploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Quick Content Updates</CardTitle>
                <CardDescription>
                  Directly edit website content and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Email</Label>
                    <Input placeholder="contact@stellarcdynamics.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input placeholder="https://linkedin.com/company/stellarcdynamics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter URL</Label>
                    <Input placeholder="https://twitter.com/stellarcdynamics" />
                  </div>
                </div>
                <Button className="glow-effect">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Website Settings</CardTitle>
                <CardDescription>
                  Configure global website settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Title</Label>
                  <Input defaultValue="Stellarc Dynamics" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea defaultValue="Pioneering the future through innovative apps, automations, and AI agents." />
                </div>
                <Button className="glow-effect">Update Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;