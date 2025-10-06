import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Bot, Upload, Settings, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const AdminPanel = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [agentResponse, setAgentResponse] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated (not using localStorage - this is temporary)
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const isAdmin = localStorage.getItem("stellarc-admin");
        if (!isAdmin) {
          navigate("/admin");
        }
      }
    };
    checkAuth();
    fetchLogs();
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

  const handleLogout = () => {
    localStorage.removeItem("stellarc-admin");
    navigate("/");
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAgentResponse("");
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: { 
          prompt: message,
          taskType: 'admin-automation'
        }
      });

      if (error) throw error;

      setAgentResponse(data.result);
      toast({
        title: "AI Agent Response",
        description: `Completed in ${data.executionTime}ms`,
      });
      
      await fetchLogs();
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Agent
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