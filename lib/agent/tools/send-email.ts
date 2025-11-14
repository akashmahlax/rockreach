import { z } from 'zod';
import { getEmailProvider } from '@/lib/agent/get-email-provider';
import { getDb, Collections } from '@/lib/db';

export function createSendEmailTool(orgId: string, emailProviderId?: string) {
  return {
    description: `Send an email to a recipient. Use this after generating email content. Provide the recipient's email, subject line, and email body (HTML or text).`,
    inputSchema: z.object({
      to: z.string().email().describe('Recipient email address'),
      subject: z.string().describe('Email subject line'),
      body: z.string().describe('Email body content (can be HTML or plain text)'),
      isHtml: z.boolean().default(true).describe('Whether the body is HTML formatted'),
      trackingId: z.string().optional().describe('Optional tracking ID to associate with this email'),
    }),
    execute: async ({ to, subject, body, isHtml, trackingId }: { to: string; subject: string; body: string; isHtml?: boolean; trackingId?: string; }) => {
      try {
        const emailClient = await getEmailProvider(orgId, emailProviderId);

        const from = `${emailClient.providerInfo.fromName} <${emailClient.providerInfo.fromEmail}>`;

        // Send email
        const result = await emailClient.send({
          from,
          to,
          subject,
          html: isHtml ? body : '',
          text: !isHtml ? body : undefined,
        });

        // Save to email tracking
        const db = await getDb();
        await db.collection(Collections.EMAIL_TRACKING).insertOne({
          organizationId: orgId,
          messageId: result.id,
          to,
          from: emailClient.providerInfo.fromEmail,
          subject,
          body,
          provider: emailClient.providerInfo.type,
          status: 'sent',
          trackingId,
          sentAt: new Date(),
          createdAt: new Date(),
        });

        return {
          success: true,
          messageId: result.id,
          to,
          subject,
          provider: emailClient.providerInfo.type,
          message: `Email sent successfully to ${to}`,
        };
      } catch (error) {
        console.error('Send email error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send email',
          to,
          subject,
        };
      }
    },
  } as const;
}
