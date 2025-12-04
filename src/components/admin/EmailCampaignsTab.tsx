import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Edit2, Save, X, TrendingUp, Users, MousePointerClick } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmailLog {
  id: string;
  user_id: string | null;
  email_type: string;
  subject: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  trigger_day: number;
  is_active: boolean;
  created_at: string;
}

interface ConversionMetrics {
  totalSignups: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  conversions: number;
  conversionRate: number;
}

const EmailCampaignsTab = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({});
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    totalSignups: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
    conversions: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailLogs();
    fetchTemplates();
    fetchMetrics();
  }, []);

  const fetchEmailLogs = async () => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setEmailLogs(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('trigger_day', { ascending: true });

    if (!error && data) {
      setTemplates(data);
    }
    setIsLoading(false);
  };

  const fetchMetrics = async () => {
    // Fetch total signups from profiles
    const { count: signupCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch email stats
    const { data: emailStats } = await supabase
      .from('email_logs')
      .select('*');

    // Fetch conversions (profiles with converted_at set)
    const { count: conversionCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('converted_at', 'is', null);

    const totalSignups = signupCount || 0;
    const emailsSent = emailStats?.length || 0;
    const emailsOpened = emailStats?.filter(e => e.opened_at).length || 0;
    const emailsClicked = emailStats?.filter(e => e.clicked_at).length || 0;
    const conversions = conversionCount || 0;

    setMetrics({
      totalSignups,
      emailsSent,
      emailsOpened,
      emailsClicked,
      conversions,
      conversionRate: totalSignups > 0 ? (conversions / totalSignups) * 100 : 0,
    });
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template.id);
    setEditedTemplate({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      trigger_day: template.trigger_day,
      is_active: template.is_active,
    });
  };

  const handleSaveTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('email_templates')
      .update({
        name: editedTemplate.name,
        subject: editedTemplate.subject,
        html_content: editedTemplate.html_content,
        trigger_day: editedTemplate.trigger_day,
        is_active: editedTemplate.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Template Saved",
        description: "Email template updated successfully",
      });
      setEditingTemplate(null);
      fetchTemplates();
    }
  };

  const handleToggleActive = async (templateId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: !currentState, updated_at: new Date().toISOString() })
      .eq('id', templateId);

    if (!error) {
      fetchTemplates();
      toast({
        title: currentState ? "Template Disabled" : "Template Enabled",
        description: `Email template is now ${currentState ? 'inactive' : 'active'}`,
      });
    }
  };

  const triggerEmailSequence = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-sequence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to trigger sequence');

      const result = await response.json();
      toast({
        title: "Email Sequence Triggered",
        description: `Processed ${result.processed || 0} emails`,
      });
      fetchEmailLogs();
      fetchMetrics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalSignups}</p>
                <p className="text-xs text-muted-foreground">Total Signups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{metrics.emailsSent}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{metrics.emailsOpened}</p>
                <p className="text-xs text-muted-foreground">Opened</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{metrics.emailsClicked}</p>
                <p className="text-xs text-muted-foreground">Clicked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{metrics.conversions}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Conv. Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates */}
      <Card className="card-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage your email drip campaign templates
              </CardDescription>
            </div>
            <Button onClick={triggerEmailSequence} className="glow-effect">
              <Send className="w-4 h-4 mr-2" />
              Process Sequence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-secondary/20 rounded-lg border border-border"
              >
                {editingTemplate === template.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input
                          value={editedTemplate.name || ''}
                          onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trigger Day</Label>
                        <Input
                          type="number"
                          value={editedTemplate.trigger_day || 0}
                          onChange={(e) => setEditedTemplate({ ...editedTemplate, trigger_day: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={editedTemplate.subject || ''}
                        onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HTML Content</Label>
                      <Textarea
                        value={editedTemplate.html_content || ''}
                        onChange={(e) => setEditedTemplate({ ...editedTemplate, html_content: e.target.value })}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editedTemplate.is_active}
                        onCheckedChange={(checked) => setEditedTemplate({ ...editedTemplate, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveTemplate(template.id)}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Trigger: {template.trigger_day === 0 ? 'Immediately' : `Day ${template.trigger_day}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(template.id, template.is_active)}
                      >
                        {template.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Email Logs
          </CardTitle>
          <CardDescription>
            Recent email delivery history and engagement tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No email logs yet. Emails will appear here once sent.
                    </TableCell>
                  </TableRow>
                ) : (
                  emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.email_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.subject || '-'}</TableCell>
                      <TableCell>
                        {log.sent_at ? new Date(log.sent_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {log.opened_at ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.clicked_at ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                            Failed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                            Sent
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCampaignsTab;
