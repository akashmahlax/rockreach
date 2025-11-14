'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  Zap,
  Mail,
  Search,
  ListChecks,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AgentTask {
  _id: string;
  type: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: AgentStep[];
  result?: {
    text: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface AgentStep {
  stepNumber: number;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: string;
  durationMs: number;
}

interface AIProvider {
  _id: string;
  name: string;
  provider: string;
  defaultModel?: string;
  isDefault: boolean;
}

interface EmailProvider {
  _id: string;
  name: string;
  provider: string;
  fromEmail: string;
  isDefault: boolean;
}

export function AgentDashboardClient({ user }: { user: { name?: string | null; email?: string | null } }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [agentType, setAgentType] = useState<string>('custom');
  const [selectedAIProvider, setSelectedAIProvider] = useState<string>('');
  const [selectedEmailProvider, setSelectedEmailProvider] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [emailProviders, setEmailProviders] = useState<EmailProvider[]>([]);

  useEffect(() => {
    fetchProviders();
    fetchTaskHistory();
  }, []);

  const fetchProviders = async () => {
    try {
      const [aiRes, emailRes] = await Promise.all([
        fetch('/api/admin/ai-providers'),
        fetch('/api/admin/email-providers'),
      ]);

      if (aiRes.ok) {
        const data = await aiRes.json();
        setAiProviders(data.providers || []);
        const defaultAI = data.providers?.find((p: AIProvider) => p.isDefault);
        if (defaultAI) setSelectedAIProvider(defaultAI._id);
      }

      if (emailRes.ok) {
        const data = await emailRes.json();
        setEmailProviders(data.providers || []);
        const defaultEmail = data.providers?.find((p: EmailProvider) => p.isDefault);
        if (defaultEmail) setSelectedEmailProvider(defaultEmail._id);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const fetchTaskHistory = async () => {
    try {
      const response = await fetch('/api/agent/tasks');
      if (response.ok) {
        const data = await response.json();
        setTaskHistory(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch task history:', error);
    }
  };

  const runAgent = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt for the agent',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAIProvider) {
      toast({
        title: 'Error',
        description: 'Please select an AI provider',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setCurrentTask(null);

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: agentType,
          aiProviderId: selectedAIProvider,
          emailProviderId: selectedEmailProvider || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute agent');
      }

      const data = await response.json();
      setCurrentTask(data.task);
      
      toast({
        title: 'Success',
        description: 'Agent task completed successfully',
      });

      // Refresh task history
      fetchTaskHistory();
    } catch (error) {
      console.error('Agent execution error:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute agent task',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead-discovery':
        return <Search className="h-4 w-4" />;
      case 'email-outreach':
        return <Mail className="h-4 w-4" />;
      case 'research':
        return <ListChecks className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Agent Control Center</h1>
        </div>
        <p className="text-muted-foreground">
          Deploy autonomous AI agents for lead discovery, email outreach, and research
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Agent Task</CardTitle>
              <CardDescription>
                Configure and deploy an AI agent to accomplish your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-type">Agent Type</Label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger id="agent-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead-discovery">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Lead Discovery
                      </div>
                    </SelectItem>
                    <SelectItem value="email-outreach">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Outreach
                      </div>
                    </SelectItem>
                    <SelectItem value="research">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Research
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Custom Task
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                    <SelectTrigger id="ai-provider">
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiProviders.map((provider) => (
                        <SelectItem key={provider._id} value={provider._id}>
                          {provider.name} {provider.isDefault && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-provider">Email Provider (Optional)</Label>
                  <Select value={selectedEmailProvider} onValueChange={setSelectedEmailProvider}>
                    <SelectTrigger id="email-provider">
                      <SelectValue placeholder="Select email provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailProviders.map((provider) => (
                        <SelectItem key={provider._id} value={provider._id}>
                          {provider.name} {provider.isDefault && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Agent Instructions</Label>
                <Textarea
                  id="prompt"
                  placeholder="Example: Find 10 CTOs at B2B SaaS companies in San Francisco with 50-200 employees, then send them personalized emails about our AI platform..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={runAgent}
                disabled={isRunning || !prompt.trim() || !selectedAIProvider}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Agent Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Deploy Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Task Execution */}
          {currentTask && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Task Execution</CardTitle>
                    {getStatusIcon(currentTask.status)}
                  </div>
                  <Badge variant={currentTask.status === 'completed' ? 'default' : 'secondary'}>
                    {currentTask.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {currentTask.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {step.toolName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {step.durationMs}ms
                            </span>
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}

                    {currentTask.result && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Final Result
                          </h4>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="whitespace-pre-wrap">{currentTask.result.text}</p>
                          </div>
                          {currentTask.result.usage && (
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Tokens: {currentTask.result.usage.totalTokens}</span>
                              <span>Prompt: {currentTask.result.usage.promptTokens}</span>
                              <span>Completion: {currentTask.result.usage.completionTokens}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {currentTask.error && (
                      <>
                        <Separator />
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                          <p className="font-semibold">Error:</p>
                          <p className="text-sm">{currentTask.error}</p>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Task History Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>History of agent executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {taskHistory.map((task) => (
                    <div
                      key={task._id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setCurrentTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(task.type)}
                          <Badge variant="outline" className="capitalize text-xs">
                            {task.type}
                          </Badge>
                        </div>
                        {getStatusIcon(task.status)}
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{task.prompt}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                      {task.steps.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.steps.length} steps
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
