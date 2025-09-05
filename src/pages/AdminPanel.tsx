import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Bot, Upload, Settings, FileText } from "lucide-react";

const AdminPanel = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("stellarc-admin");
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("stellarc-admin");
    navigate("/");
  };

  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate AI agent processing
    setTimeout(() => {
      toast({
        title: "Agent Response",
        description: `Processing: "${message}". This is a placeholder for AI agent functionality.`,
      });
      setMessage("");
      setIsLoading(false);
    }, 2000);
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

  const uploadFile = () => {
    if (selectedFile) {
      toast({
        title: "File Uploaded",
        description: `${selectedFile.name} has been uploaded successfully`,
      });
      setSelectedFile(null);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Agent
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
                    {isLoading ? "Processing..." : "Execute Command"}
                  </Button>
                </form>
                
                <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-primary">Available Commands:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Change colors, fonts, or styling</li>
                    <li>• Add or modify content sections</li>
                    <li>• Create new pages or links</li>
                    <li>• Update contact information</li>
                    <li>• Modify service descriptions</li>
                  </ul>
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
                    <Button onClick={uploadFile} className="mt-2" size="sm">
                      Upload File
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