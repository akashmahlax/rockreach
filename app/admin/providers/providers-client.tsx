'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface AIProvider {
  _id?: string;
  provider: string;
  name: string;
  apiKey?: string;
  hasCredentials?: boolean;
  defaultModel?: string;
  isEnabled: boolean;
  isDefault: boolean;
  config?: Record<string, unknown>;
}

interface EmailProvider {
  _id?: string;
  provider: string;
  name: string;
  apiKey?: string;
  smtpConfig?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
  };
  hasCredentials?: boolean;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  isDefault: boolean;
  dailyLimit?: number;
}

const AI_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'groq', label: 'Groq' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'perplexity', label: 'Perplexity' },
];

const EMAIL_PROVIDER_OPTIONS = [
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'smtp', label: 'SMTP' },
];

export function ProvidersClient() {
  const { toast } = useToast();
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [emailProviders, setEmailProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingAi, setEditingAi] = useState<AIProvider | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const [aiRes, emailRes] = await Promise.all([
        fetch('/api/admin/ai-providers'),
        fetch('/api/admin/email-providers'),
      ]);

      if (aiRes.ok) {
        const data = await aiRes.json();
        setAiProviders(data.providers || []);
      }

      if (emailRes.ok) {
        const data = await emailRes.json();
        setEmailProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load providers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAiProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingAi?._id,
          provider: formData.get('provider'),
          name: formData.get('name'),
          apiKey: formData.get('apiKey'),
          defaultModel: formData.get('defaultModel'),
          isEnabled: formData.get('isEnabled') === 'on',
          isDefault: formData.get('isDefault') === 'on',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save provider');
      }

      toast({
        title: 'Success',
        description: `AI provider ${editingAi ? 'updated' : 'created'} successfully`,
      });

      setAiDialogOpen(false);
      setEditingAi(null);
      fetchProviders();
    } catch (error) {
      console.error('Failed to save AI provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to save AI provider',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEmailProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const provider = formData.get('provider') as string;

    const body: Partial<EmailProvider> & {
      smtpConfig?: {
        host: string | null;
        port: number;
        secure: boolean;
        user: string | null;
        password: string | null;
      };
    } = {
      _id: editingEmail?._id,
      provider,
      name: formData.get('name') as string,
      fromEmail: formData.get('fromEmail') as string,
      fromName: formData.get('fromName') as string,
      isEnabled: formData.get('isEnabled') === 'on',
      isDefault: formData.get('isDefault') === 'on',
      dailyLimit: parseInt(formData.get('dailyLimit') as string) || undefined,
    };

    if (provider === 'smtp') {
      body.smtpConfig = {
        host: formData.get('smtpHost') as string,
        port: parseInt(formData.get('smtpPort') as string),
        secure: formData.get('smtpSecure') === 'on',
        user: formData.get('smtpUser') as string,
        password: formData.get('smtpPassword') as string,
      };
    } else {
      body.apiKey = formData.get('apiKey') as string;
    }

    try {
      const response = await fetch('/api/admin/email-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save provider');
      }

      toast({
        title: 'Success',
        description: `Email provider ${editingEmail ? 'updated' : 'created'} successfully`,
      });

      setEmailDialogOpen(false);
      setEditingEmail(null);
      fetchProviders();
    } catch (error) {
      console.error('Failed to save email provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email provider',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAiProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`/api/admin/ai-providers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete provider');
      }

      toast({
        title: 'Success',
        description: 'AI provider deleted successfully',
      });

      fetchProviders();
    } catch (error) {
      console.error('Failed to delete AI provider:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete AI provider',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmailProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`/api/admin/email-providers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete provider');
      }

      toast({
        title: 'Success',
        description: 'Email provider deleted successfully',
      });

      fetchProviders();
    } catch (error) {
      console.error('Failed to delete email provider:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete email provider',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Global Provider Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI and email providers that work across the entire platform for all organizations
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          <TabsTrigger value="email">Email Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage AI providers for agent capabilities
            </p>
            <Button
              onClick={() => {
                setEditingAi(null);
                setShowApiKey(false);
                setAiDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add AI Provider
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiProviders.map((provider) => (
              <Card key={provider._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        {provider.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {provider.provider}
                      </CardDescription>
                    </div>
                    {provider.isEnabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {provider.defaultModel && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Model: {provider.defaultModel}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingAi(provider);
                        setShowApiKey(false);
                        setAiDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAiProvider(provider._id!)}
                      disabled={provider.isDefault}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage email providers for campaigns and outreach
            </p>
            <Button
              onClick={() => {
                setEditingEmail(null);
                setShowApiKey(false);
                setEmailDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Email Provider
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {emailProviders.map((provider) => (
              <Card key={provider._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        {provider.isDefault && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {provider.provider}
                      </CardDescription>
                    </div>
                    {provider.isEnabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    {provider.fromName} &lt;{provider.fromEmail}&gt;
                  </p>
                  {provider.dailyLimit && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Limit: {provider.dailyLimit} emails/day
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEmail(provider);
                        setShowApiKey(false);
                        setEmailDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEmailProvider(provider._id!)}
                      disabled={provider.isDefault}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Provider Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveAiProvider}>
            <DialogHeader>
              <DialogTitle>
                {editingAi ? 'Edit' : 'Add'} AI Provider
              </DialogTitle>
              <DialogDescription>
                Configure an AI provider for your organization
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider Type</Label>
                <Select
                  name="provider"
                  defaultValue={editingAi?.provider || 'openai'}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Production OpenAI"
                  defaultValue={editingAi?.name}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={
                      editingAi?.hasCredentials
                        ? '••••••••••••••••'
                        : 'Enter API key'
                    }
                    required={!editingAi}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defaultModel">Default Model (Optional)</Label>
                <Input
                  id="defaultModel"
                  name="defaultModel"
                  placeholder="e.g., gpt-4o"
                  defaultValue={editingAi?.defaultModel}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  name="isEnabled"
                  defaultChecked={editingAi?.isEnabled ?? true}
                />
                <Label htmlFor="isEnabled">Enabled</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  name="isDefault"
                  defaultChecked={editingAi?.isDefault ?? false}
                />
                <Label htmlFor="isDefault">Set as default</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAiDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Provider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Provider Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveEmailProvider}>
            <DialogHeader>
              <DialogTitle>
                {editingEmail ? 'Edit' : 'Add'} Email Provider
              </DialogTitle>
              <DialogDescription>
                Configure an email provider for campaigns
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email-provider">Provider Type</Label>
                <Select
                  name="provider"
                  defaultValue={editingEmail?.provider || 'resend'}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_PROVIDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email-name">Name</Label>
                <Input
                  id="email-name"
                  name="name"
                  placeholder="e.g., Primary Resend Account"
                  defaultValue={editingEmail?.name}
                  required
                />
              </div>

              {/* Show different fields based on provider */}
              <div id="credentials-section" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="email-apiKey"
                      name="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={
                        editingEmail?.hasCredentials
                          ? '••••••••••••••••'
                          : 'Enter API key'
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* SMTP fields - show when provider is SMTP */}
                <div id="smtp-section" className="space-y-4 border-t pt-4">
                  <p className="text-sm font-medium">SMTP Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        name="smtpHost"
                        placeholder="smtp.example.com"
                        defaultValue={editingEmail?.smtpConfig?.host}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input
                        id="smtpPort"
                        name="smtpPort"
                        type="number"
                        placeholder="587"
                        defaultValue={editingEmail?.smtpConfig?.port}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpUser">Username</Label>
                    <Input
                      id="smtpUser"
                      name="smtpUser"
                      placeholder="user@example.com"
                      defaultValue={editingEmail?.smtpConfig?.user}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input
                      id="smtpPassword"
                      name="smtpPassword"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpSecure"
                      name="smtpSecure"
                      defaultChecked={editingEmail?.smtpConfig?.secure ?? true}
                    />
                    <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    name="fromEmail"
                    type="email"
                    placeholder="noreply@example.com"
                    defaultValue={editingEmail?.fromEmail}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    name="fromName"
                    placeholder="Your Company"
                    defaultValue={editingEmail?.fromName}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyLimit">Daily Email Limit (Optional)</Label>
                <Input
                  id="dailyLimit"
                  name="dailyLimit"
                  type="number"
                  placeholder="1000"
                  defaultValue={editingEmail?.dailyLimit}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="email-isEnabled"
                  name="isEnabled"
                  defaultChecked={editingEmail?.isEnabled ?? true}
                />
                <Label htmlFor="email-isEnabled">Enabled</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="email-isDefault"
                  name="isDefault"
                  defaultChecked={editingEmail?.isDefault ?? false}
                />
                <Label htmlFor="email-isDefault">Set as default</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Provider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
