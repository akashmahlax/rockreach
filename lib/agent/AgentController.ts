import { generateText } from 'ai';
import { getAIProvider } from './get-provider';
import { visitWebsiteTool } from './tools/visit-website';
import { searchLeadsTool } from './tools/search-leads';
import { generateEmailTool } from './tools/generate-email';
import { createSendEmailTool } from './tools/send-email';
import { createSaveLeadTool } from './tools/save-lead';
import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface AgentTask {
  _id?: string;
  organizationId: string;
  userId: string;
  type: 'lead-discovery' | 'email-outreach' | 'research' | 'custom';
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  aiProviderId?: string;
  emailProviderId?: string;
  steps: AgentStep[];
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentStep {
  stepNumber: number;
  toolName: string;
  input: unknown;
  output: unknown;
  timestamp: Date;
  durationMs: number;
}

export class AgentController {
  private orgId: string;
  private userId: string;
  private taskId?: string;
  private aiProviderId?: string;
  private emailProviderId?: string;

  constructor(orgId: string, userId: string, aiProviderId?: string, emailProviderId?: string) {
    this.orgId = orgId;
    this.userId = userId;
    this.aiProviderId = aiProviderId;
    this.emailProviderId = emailProviderId;
  }

  async executeTask(prompt: string, type: AgentTask['type'] = 'custom'): Promise<AgentTask> {
    const db = await getDb();
    
    // Create task record
    const task: AgentTask = {
      organizationId: this.orgId,
      userId: this.userId,
      type,
      prompt,
      status: 'pending',
      aiProviderId: this.aiProviderId,
      emailProviderId: this.emailProviderId,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedId = new ObjectId();
    type AgentTaskDocument = Omit<AgentTask, '_id'> & { _id: ObjectId };
    const { _id: _omitId, ...taskForInsert } = task;
    void _omitId;
    const taskDoc: AgentTaskDocument = { ...(taskForInsert as Omit<AgentTask, '_id'>), _id: insertedId };
    await db.collection(Collections.AGENT_TASKS).insertOne(taskDoc);
    this.taskId = insertedId.toHexString();
    task._id = this.taskId;

    try {
      // Update status to running
      await this.updateTaskStatus('running', { startedAt: new Date() });

      // Get AI provider
      const aiProvider = await getAIProvider(this.orgId, this.aiProviderId);

      // Prepare tools
      const tools = {
        visitWebsite: visitWebsiteTool,
        searchLeads: searchLeadsTool,
        generateEmail: generateEmailTool,
        sendEmail: createSendEmailTool(this.orgId, this.emailProviderId),
        saveLead: createSaveLeadTool(this.orgId, this.userId),
      };

      // System prompt based on task type
      const systemPrompt = this.getSystemPrompt(type);

      // Execute agent with tools
      const startTime = Date.now();
      const response = await generateText({
        model: aiProvider.model,
        system: systemPrompt,
        prompt,
        tools,
        onStepFinish: async (step) => {
          // Log each step
          type ToolCallLike = { toolName?: string; args?: unknown };
          type StepLike = { toolCalls?: ToolCallLike[]; text?: unknown; toolResults?: unknown[] };
          const s = step as unknown as StepLike;
          const stepData: AgentStep = {
            stepNumber: task.steps.length + 1,
            toolName: s?.toolCalls?.[0]?.toolName || 'thinking',
            input: s?.toolCalls?.[0]?.args || {},
            output: s.toolResults?.[0] || s.text,
            timestamp: new Date(),
            durationMs: Date.now() - startTime,
          };

          task.steps.push(stepData);

          // Update task in database
          await db.collection(Collections.AGENT_TASKS).updateOne(
            { _id: new ObjectId(this.taskId) },
            {
              $set: {
                steps: task.steps,
                updatedAt: new Date(),
              },
            }
          );
        },
      });

      // Task completed successfully
      task.result = {
        text: response.text,
        usage: response.usage,
        finishReason: response.finishReason,
      };
      task.status = 'completed';
      task.completedAt = new Date();

      await this.updateTaskStatus('completed', {
        result: task.result,
        completedAt: task.completedAt,
      });

      return task;
    } catch (error) {
      console.error('Agent execution error:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();

      await this.updateTaskStatus('failed', {
        error: task.error,
        completedAt: task.completedAt,
      });

      throw error;
    }
  }

  private getSystemPrompt(type: AgentTask['type']): string {
    switch (type) {
      case 'lead-discovery':
        return `You are an expert lead generation AI agent. Your goal is to find and qualify leads based on the user's requirements.

Available tools:
- visitWebsite: Browse company websites to gather information
- searchLeads: Search for people using RocketReach (by company + role, or LinkedIn URL)
- saveLead: Save qualified leads to the database

Process:
1. Understand the user's target criteria (industry, company size, roles, location, etc.)
2. Research companies if needed (use visitWebsite)
3. Search for relevant contacts (use searchLeads)
4. Evaluate if they match criteria
5. Save qualified leads (use saveLead)

Be thorough but efficient. Provide clear summaries of your findings.`;

      case 'email-outreach':
        return `You are an expert email outreach AI agent. Your goal is to craft and send personalized emails to leads.

Available tools:
- searchLeads: Look up lead information if needed
- generateEmail: Create personalized email content
- sendEmail: Send the email to the recipient
- saveLead: Update lead information

Process:
1. Understand the outreach goal and target audience
2. Look up lead information if not provided
3. Generate personalized, compelling emails
4. Send emails to qualified recipients
5. Track sent emails

Focus on personalization and value proposition. Keep emails concise and professional.`;

      case 'research':
        return `You are an expert research AI agent. Your goal is to gather and analyze information from various sources.

Available tools:
- visitWebsite: Browse websites to collect information
- searchLeads: Look up company and people information

Process:
1. Understand the research objective
2. Identify relevant sources
3. Gather information systematically
4. Synthesize findings
5. Provide clear, structured insights

Be thorough and cite your sources.`;

      default:
        return `You are a helpful AI agent with access to various tools. Use them intelligently to accomplish the user's goals.

Available tools:
- visitWebsite: Browse websites
- searchLeads: Search for people and companies
- generateEmail: Create email content
- sendEmail: Send emails
- saveLead: Save contact information

Follow the user's instructions carefully and provide clear updates on your progress.`;
    }
  }

  private async updateTaskStatus(
    status: AgentTask['status'],
    updates: Partial<AgentTask> = {}
  ): Promise<void> {
    if (!this.taskId) return;

    const db = await getDb();
    await db.collection(Collections.AGENT_TASKS).updateOne(
      { _id: new ObjectId(this.taskId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          ...updates,
        },
      }
    );
  }

  async getTask(): Promise<AgentTask | null> {
    if (!this.taskId) return null;

    const db = await getDb();
    const doc = await db.collection(Collections.AGENT_TASKS).findOne({
      _id: new ObjectId(this.taskId),
    });
    if (!doc) return null;
    type DocLike = { _id?: { toHexString?: () => string } } & Record<string, unknown>;
    const d = doc as DocLike;
    const { _id, ...rest } = d;
    return { _id: _id?.toHexString?.() || String(_id), ...(rest as Record<string, unknown>) } as AgentTask;
  }

  static async getTaskById(taskId: string): Promise<AgentTask | null> {
    const db = await getDb();
    const doc = await db.collection(Collections.AGENT_TASKS).findOne({ _id: new ObjectId(taskId) });
    if (!doc) return null;
    type DocLike = { _id?: { toHexString?: () => string } } & Record<string, unknown>;
    const d = doc as DocLike;
    const { _id, ...rest } = d;
    return { _id: _id?.toHexString?.() || String(_id), ...(rest as Record<string, unknown>) } as AgentTask;
  }

  static async listTasks(orgId: string, limit = 50): Promise<AgentTask[]> {
    const db = await getDb();
    const docs = await db
      .collection(Collections.AGENT_TASKS)
      .find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    type DocLike = { _id?: { toHexString?: () => string } } & Record<string, unknown>;
    return (docs as DocLike[]).map((d) => {
      const { _id, ...rest } = d;
      return { _id: _id?.toHexString?.() || String(_id), ...(rest as Record<string, unknown>) } as AgentTask;
    });
  }
}
