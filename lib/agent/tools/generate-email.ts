import { z } from 'zod';

export const generateEmailTool = {
  description: `Generate a personalized email for outreach. Provide context about the recipient and the purpose of the email. The AI will craft an appropriate, professional email.`,
  inputSchema: z.object({
    recipientName: z.string().describe('Name of the email recipient'),
    recipientCompany: z.string().optional().describe('Company where the recipient works'),
    recipientRole: z.string().optional().describe('Job title or role of the recipient'),
    purpose: z.string().describe('Purpose of the email (e.g., "introduce our product", "request meeting", "follow up")'),
    context: z.string().optional().describe('Additional context or details to include'),
    tone: z.enum(['formal', 'professional', 'casual', 'friendly']).default('professional').describe('Tone of the email'),
  }),
  execute: async ({ recipientName, recipientCompany, recipientRole, purpose, context, tone }: { recipientName: string; recipientCompany?: string; recipientRole?: string; purpose: string; context?: string; tone: 'formal' | 'professional' | 'casual' | 'friendly'; }) => {
    // This tool returns a request for the AI to generate the email
    // The actual generation happens via the AI model in the agent controller
    
    const prompt = `Generate a ${tone} email with the following details:
    
Recipient: ${recipientName}${recipientRole ? ` - ${recipientRole}` : ''}${recipientCompany ? ` at ${recipientCompany}` : ''}
Purpose: ${purpose}
${context ? `Context: ${context}` : ''}

Requirements:
- Subject line (start with "Subject: ")
- Professional greeting
- Clear, concise body (2-3 paragraphs max)
- Strong call-to-action
- Professional signature line

Format the output as:
Subject: [subject line]

[email body]`;

    return {
      success: true,
      needsGeneration: true,
      prompt,
      recipientInfo: {
        name: recipientName,
        company: recipientCompany,
        role: recipientRole,
      },
    };
  },
} as const;
