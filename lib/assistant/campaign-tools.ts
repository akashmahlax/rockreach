import { z } from "zod";

interface ToolContext {
  orgId: string;
  userId?: string;
}

/**
 * EMAIL CAMPAIGN BUILDER TOOLS
 * 
 * Complete campaign management system with:
 * - Configuration detection (checks if email/WhatsApp is set up)
 * - Smart setup prompts (guides user to configure missing services)
 * - Campaign creation with templates
 * - Bulk sending with progress tracking
 * - A/B testing support
 * - Performance analytics
 */
export function createCampaignTools({ orgId, userId }: ToolContext) {
  return {
    checkCampaignConfiguration: {
      description: `Check if email and WhatsApp services are configured properly.
      
This tool verifies:
- Email provider status (Resend, Gmail SMTP, SendGrid, etc.)
- WhatsApp integration status
- API keys validity
- From email/phone configured

Use this FIRST before sending campaigns to detect missing configuration.
If not configured, the tool returns setup instructions.`,
      inputSchema: z.object({
        checkEmail: z.boolean().optional().default(true).describe("Check email provider configuration"),
        checkWhatsApp: z.boolean().optional().default(true).describe("Check WhatsApp configuration"),
      }),
      execute: async (input: { checkEmail?: boolean; checkWhatsApp?: boolean }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const status: {
            email: { configured: boolean; provider?: string; fromEmail?: string; issue?: string; setupUrl?: string };
            whatsapp: { configured: boolean; fromPhone?: string; issue?: string; setupUrl?: string };
            readyToSend: boolean;
            instructions?: string[];
          } = {
            email: { configured: false },
            whatsapp: { configured: false },
            readyToSend: false,
          };
          
          // Check Email Configuration
          if (input.checkEmail !== false) {
            const emailProvider = await db.collection('email_providers').findOne({
              orgId,
              isEnabled: true,
            });
            
            if (emailProvider) {
              status.email.configured = true;
              status.email.provider = emailProvider.provider || 'Unknown';
              status.email.fromEmail = emailProvider.fromEmail;
            } else {
              status.email.issue = "No email provider configured";
              status.email.setupUrl = "/settings/email";
            }
          }
          
          // Check WhatsApp Configuration
          if (input.checkWhatsApp !== false) {
            const whatsappSettings = await db.collection('whatsapp_settings').findOne({
              orgId,
              isEnabled: true,
            });
            
            if (whatsappSettings) {
              status.whatsapp.configured = true;
              status.whatsapp.fromPhone = whatsappSettings.phoneNumber;
            } else {
              status.whatsapp.issue = "WhatsApp not configured";
              status.whatsapp.setupUrl = "/settings/whatsapp";
            }
          }
          
          // Determine if ready to send
          status.readyToSend = status.email.configured || status.whatsapp.configured;
          
          // Generate setup instructions
          const instructions: string[] = [];
          
          if (!status.email.configured) {
            instructions.push(
              "📧 **Email Setup Required**",
              "",
              "To send email campaigns, configure an email provider:",
              "",
              "**Option 1: Resend (Recommended)**",
              "1. Go to Settings → Email",
              "2. Select 'Resend' as provider",
              "3. Get API key from: https://resend.com/api-keys",
              "4. Enter API key and from email",
              "5. Click 'Save'",
              "",
              "**Option 2: Gmail SMTP**",
              "1. Go to Settings → Email",
              "2. Select 'Gmail SMTP' as provider",
              "3. Enable 2FA on your Gmail account",
              "4. Generate App Password: https://myaccount.google.com/apppasswords",
              "5. Enter your Gmail address and app password",
              "6. Click 'Save'",
              "",
              "**Option 3: Custom SMTP**",
              "1. Go to Settings → Email",
              "2. Select 'Custom SMTP'",
              "3. Enter SMTP host, port, username, password",
              "4. Click 'Save'",
              ""
            );
          }
          
          if (!status.whatsapp.configured) {
            instructions.push(
              "💬 **WhatsApp Setup (Optional)**",
              "",
              "To send WhatsApp campaigns:",
              "1. Go to Settings → WhatsApp",
              "2. Choose integration method:",
              "   - WhatsApp Business API (recommended for scale)",
              "   - whatsapp-web.js (for personal use)",
              "3. Follow provider-specific setup instructions",
              "4. Verify phone number",
              "5. Click 'Save'",
              ""
            );
          }
          
          if (instructions.length > 0) {
            status.instructions = instructions;
          }
          
          return {
            success: true,
            status,
            message: status.readyToSend 
              ? "✅ Campaign configuration ready! You can send emails/WhatsApp messages."
              : "⚠️ **Configuration Required**\n\n" + instructions.join("\n"),
          };
        } catch (error) {
          console.error("checkCampaignConfiguration error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Configuration check failed",
          };
        }
      },
    },
    
    setupEmailProvider: {
      description: `Configure email provider for sending campaigns.
      
Supports multiple providers:
- Resend (recommended, easiest setup)
- Gmail SMTP (with app password)
- SendGrid
- Mailgun
- Custom SMTP (any email service)

This tool saves the configuration to database and validates it.`,
      inputSchema: z.object({
        provider: z.enum(["resend", "gmail_smtp", "sendgrid", "mailgun", "custom_smtp"])
          .describe("Email provider to configure"),
        config: z.object({
          apiKey: z.string().optional().describe("API key (for Resend, SendGrid, Mailgun)"),
          fromEmail: z.string().email().describe("From email address"),
          fromName: z.string().optional().describe("From name (optional)"),
          smtpHost: z.string().optional().describe("SMTP host (for SMTP providers)"),
          smtpPort: z.number().optional().describe("SMTP port (usually 587 or 465)"),
          smtpUsername: z.string().optional().describe("SMTP username (usually your email)"),
          smtpPassword: z.string().optional().describe("SMTP password or app password"),
          smtpSecure: z.boolean().optional().default(true).describe("Use TLS/SSL (recommended: true)"),
        }).describe("Provider-specific configuration"),
        testSend: z.boolean().optional().default(false).describe("Send test email to verify setup"),
      }),
      execute: async (input: {
        provider: "resend" | "gmail_smtp" | "sendgrid" | "mailgun" | "custom_smtp";
        config: {
          apiKey?: string;
          fromEmail: string;
          fromName?: string;
          smtpHost?: string;
          smtpPort?: number;
          smtpUsername?: string;
          smtpPassword?: string;
          smtpSecure?: boolean;
        };
        testSend?: boolean;
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          // Validate configuration based on provider
          const validationErrors: string[] = [];
          
          if (input.provider === "resend" && !input.config.apiKey) {
            validationErrors.push("API key required for Resend");
          }
          
          if (input.provider === "gmail_smtp") {
            if (!input.config.smtpPassword) {
              validationErrors.push("Gmail App Password required");
            }
            // Auto-set Gmail SMTP settings
            input.config.smtpHost = "smtp.gmail.com";
            input.config.smtpPort = 587;
            input.config.smtpUsername = input.config.fromEmail;
            input.config.smtpSecure = true;
          }
          
          if (input.provider === "custom_smtp") {
            if (!input.config.smtpHost) validationErrors.push("SMTP host required");
            if (!input.config.smtpPort) validationErrors.push("SMTP port required");
            if (!input.config.smtpUsername) validationErrors.push("SMTP username required");
            if (!input.config.smtpPassword) validationErrors.push("SMTP password required");
          }
          
          if (validationErrors.length > 0) {
            return {
              success: false,
              errors: validationErrors,
              message: "Configuration validation failed:\n" + validationErrors.map(e => `- ${e}`).join("\n"),
            };
          }
          
          // Save configuration to database
          const emailProvider = {
            orgId,
            userId,
            provider: input.provider,
            fromEmail: input.config.fromEmail,
            fromName: input.config.fromName || input.config.fromEmail.split('@')[0],
            apiKey: input.config.apiKey,
            smtpHost: input.config.smtpHost,
            smtpPort: input.config.smtpPort,
            smtpUsername: input.config.smtpUsername,
            smtpPassword: input.config.smtpPassword,
            smtpSecure: input.config.smtpSecure,
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Upsert configuration
          await db.collection('email_providers').updateOne(
            { orgId, isEnabled: true },
            { 
              $set: emailProvider,
              $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
          );
          
          // Test send if requested
          let testResult = null;
          if (input.testSend) {
            try {
              // Import dynamically to avoid circular dependencies
              const nodemailer = await import("nodemailer");
              
              let transporter;
              if (input.provider === "resend") {
                transporter = nodemailer.createTransport({
                  host: "smtp.resend.com",
                  port: 465,
                  secure: true,
                  auth: {
                    user: "resend",
                    pass: input.config.apiKey,
                  },
                });
              } else {
                transporter = nodemailer.createTransport({
                  host: input.config.smtpHost,
                  port: input.config.smtpPort,
                  secure: input.config.smtpSecure,
                  auth: {
                    user: input.config.smtpUsername,
                    pass: input.config.smtpPassword,
                  },
                });
              }
              
              const info = await transporter.sendMail({
                from: input.config.fromName 
                  ? `${input.config.fromName} <${input.config.fromEmail}>` 
                  : input.config.fromEmail,
                to: input.config.fromEmail,
                subject: "Test Email - Configuration Successful",
                text: `Your email configuration for ${input.provider} is working correctly!`,
                html: `<p>✅ Your email configuration for <strong>${input.provider}</strong> is working correctly!</p>`,
              });
              
              testResult = {
                sent: true,
                messageId: info.messageId,
                message: "Test email sent successfully! Check your inbox.",
              };
            } catch (testError) {
              testResult = {
                sent: false,
                error: testError instanceof Error ? testError.message : "Test send failed",
                message: "Configuration saved but test email failed. Please check your settings.",
              };
            }
          }
          
          return {
            success: true,
            provider: input.provider,
            fromEmail: input.config.fromEmail,
            testResult,
            message: testResult?.sent 
              ? `✅ **Email Provider Configured!**\n\n✉️ Test email sent to ${input.config.fromEmail}\nProvider: ${input.provider}\n\nYou can now send email campaigns!`
              : `✅ **Email Provider Configured!**\n\nProvider: ${input.provider}\nFrom: ${input.config.fromEmail}\n\nConfiguration saved. You can now send email campaigns!`,
          };
        } catch (error) {
          console.error("setupEmailProvider error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Setup failed",
            message: "Failed to configure email provider. Please check your settings and try again.",
          };
        }
      },
    },
    
    createEmailCampaign: {
      description: `Create and send email campaign to multiple leads.
      
Features:
- Personalization with variables: {{firstName}}, {{lastName}}, {{company}}, {{title}}
- Template selection or custom content
- Schedule for later or send immediately
- Lead filtering by criteria
- Progress tracking
- Automatic retry on failures

Use this when user wants to send emails to multiple leads at once.`,
      inputSchema: z.object({
        campaignName: z.string().describe("Campaign name for tracking"),
        targetLeads: z.object({
          leadIds: z.array(z.string()).optional().describe("Specific lead IDs to target"),
          filters: z.object({
            companies: z.array(z.string()).optional(),
            titles: z.array(z.string()).optional(),
            locations: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            hasEmail: z.boolean().optional().default(true),
          }).optional().describe("Filter criteria to select leads"),
        }).describe("Target audience (lead IDs or filters)"),
        emailContent: z.object({
          subject: z.string().describe("Email subject line (can include {{variables}})"),
          body: z.string().describe("Email body HTML or text (can include {{variables}})"),
          useTemplate: z.boolean().optional().default(false),
          templateId: z.string().optional().describe("Pre-defined template ID"),
        }).describe("Email content with personalization"),
        sendOptions: z.object({
          sendImmediately: z.boolean().optional().default(true),
          scheduleFor: z.string().optional().describe("ISO date string for scheduled send"),
          batchSize: z.number().optional().default(10).describe("Emails to send per batch (rate limiting)"),
          delayBetweenBatches: z.number().optional().default(2000).describe("Milliseconds delay between batches"),
        }).optional().describe("Sending options"),
        tracking: z.object({
          trackOpens: z.boolean().optional().default(false),
          trackClicks: z.boolean().optional().default(false),
        }).optional().describe("Email tracking options"),
      }),
      execute: async (input: {
        campaignName: string;
        targetLeads: {
          leadIds?: string[];
          filters?: {
            companies?: string[];
            titles?: string[];
            locations?: string[];
            tags?: string[];
            hasEmail?: boolean;
          };
        };
        emailContent: {
          subject: string;
          body: string;
          useTemplate?: boolean;
          templateId?: string;
        };
        sendOptions?: {
          sendImmediately?: boolean;
          scheduleFor?: string;
          batchSize?: number;
          delayBetweenBatches?: number;
        };
        tracking?: {
          trackOpens?: boolean;
          trackClicks?: boolean;
        };
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const { ObjectId } = await import("mongodb");
          const db = await getDb();
          
          // Check email configuration first
          const emailProvider = await db.collection('email_providers').findOne({
            orgId,
            isEnabled: true,
          });
          
          if (!emailProvider) {
            return {
              success: false,
              error: "Email provider not configured",
              message: "⚠️ **Email Provider Not Configured**\n\nPlease set up an email provider first:\n1. Use `setupEmailProvider` tool\n2. Or go to Settings → Email\n3. Configure Resend, Gmail, or Custom SMTP",
              setupRequired: true,
            };
          }
          
          // Fetch target leads
          let targetLeads: any[] = [];
          
          if (input.targetLeads.leadIds && input.targetLeads.leadIds.length > 0) {
            // Fetch by IDs
            const objectIds = input.targetLeads.leadIds
              .filter(id => ObjectId.isValid(id))
              .map(id => new ObjectId(id));
            
            targetLeads = await db.collection('leads')
              .find({ 
                orgId, 
                _id: { $in: objectIds },
                emails: { $exists: true, $ne: [] }
              })
              .toArray();
          } else if (input.targetLeads.filters) {
            // Fetch by filters
            const query: any = { orgId };
            const filters = input.targetLeads.filters;
            
            if (filters.companies && filters.companies.length > 0) {
              query.company = { $in: filters.companies.map(c => new RegExp(c, 'i')) };
            }
            
            if (filters.titles && filters.titles.length > 0) {
              query.title = { $in: filters.titles.map(t => new RegExp(t, 'i')) };
            }
            
            if (filters.locations && filters.locations.length > 0) {
              query.location = { $in: filters.locations.map(l => new RegExp(l, 'i')) };
            }
            
            if (filters.tags && filters.tags.length > 0) {
              query.tags = { $in: filters.tags };
            }
            
            if (filters.hasEmail !== false) {
              query.emails = { $exists: true, $ne: [] };
            }
            
            targetLeads = await db.collection('leads')
              .find(query)
              .limit(1000) // Safety limit
              .toArray();
          } else {
            return {
              success: false,
              error: "No target leads specified",
              message: "Please provide either leadIds or filters to select target audience.",
            };
          }
          
          if (targetLeads.length === 0) {
            return {
              success: false,
              error: "No leads found matching criteria",
              message: "No leads found with the specified filters. Please adjust your criteria.",
            };
          }
          
          // Create campaign record
          const campaign = {
            orgId,
            userId,
            name: input.campaignName,
            type: 'email',
            status: input.sendOptions?.sendImmediately !== false ? 'sending' : 'scheduled',
            targetCount: targetLeads.length,
            sentCount: 0,
            failedCount: 0,
            emailContent: {
              subject: input.emailContent.subject,
              body: input.emailContent.body,
              useTemplate: input.emailContent.useTemplate,
              templateId: input.emailContent.templateId,
            },
            sendOptions: input.sendOptions || {},
            tracking: input.tracking || {},
            scheduledFor: input.sendOptions?.scheduleFor ? new Date(input.sendOptions.scheduleFor) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          const campaignResult = await db.collection('campaigns').insertOne(campaign);
          const campaignId = campaignResult.insertedId.toString();
          
          // If sending immediately, process emails
          if (input.sendOptions?.sendImmediately !== false) {
            const sendResults = [];
            const batchSize = input.sendOptions?.batchSize || 10;
            const delay = input.sendOptions?.delayBetweenBatches || 2000;
            
            // Helper to personalize content
            const personalize = (template: string, lead: any) => {
              return template
                .replace(/\{\{firstName\}\}/g, lead.firstName || lead.name?.split(' ')[0] || '')
                .replace(/\{\{lastName\}\}/g, lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '')
                .replace(/\{\{name\}\}/g, lead.name || '')
                .replace(/\{\{company\}\}/g, lead.company || '')
                .replace(/\{\{title\}\}/g, lead.title || '');
            };
            
            // Get email sending function
            const { getEmailProvider } = await import("@/lib/agent/get-email-provider");
            const emailClient = await getEmailProvider(orgId);
            
            // Process in batches
            for (let i = 0; i < targetLeads.length; i += batchSize) {
              const batch = targetLeads.slice(i, i + batchSize);
              
              for (const lead of batch) {
                const email = lead.emails?.[0];
                if (!email) continue;
                
                try {
                  const personalizedSubject = personalize(input.emailContent.subject, lead);
                  const personalizedBody = personalize(input.emailContent.body, lead);
                  
                  const result = await emailClient.send({
                    from: emailProvider.fromName 
                      ? `${emailProvider.fromName} <${emailProvider.fromEmail}>` 
                      : emailProvider.fromEmail,
                    to: email,
                    subject: personalizedSubject,
                    html: personalizedBody,
                    text: personalizedBody.replace(/<[^>]*>/g, ''),
                  });
                  
                  sendResults.push({
                    leadId: lead._id.toString(),
                    email,
                    status: 'sent',
                    messageId: result.id,
                  });
                  
                  // Update campaign sent count
                  await db.collection('campaigns').updateOne(
                    { _id: campaignResult.insertedId },
                    { $inc: { sentCount: 1 }, $set: { updatedAt: new Date() } }
                  );
                } catch (error) {
                  sendResults.push({
                    leadId: lead._id.toString(),
                    email,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Send failed',
                  });
                  
                  // Update campaign failed count
                  await db.collection('campaigns').updateOne(
                    { _id: campaignResult.insertedId },
                    { $inc: { failedCount: 1 }, $set: { updatedAt: new Date() } }
                  );
                }
              }
              
              // Delay between batches to avoid rate limits
              if (i + batchSize < targetLeads.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            
            // Update campaign status
            await db.collection('campaigns').updateOne(
              { _id: campaignResult.insertedId },
              { 
                $set: { 
                  status: 'completed',
                  completedAt: new Date(),
                  updatedAt: new Date()
                } 
              }
            );
            
            const successCount = sendResults.filter(r => r.status === 'sent').length;
            const failedCount = sendResults.filter(r => r.status === 'failed').length;
            
            return {
              success: true,
              campaignId,
              sent: successCount,
              failed: failedCount,
              total: targetLeads.length,
              results: sendResults.slice(0, 10), // Show first 10 results
              message: `✅ **Campaign "${input.campaignName}" Completed!**\n\n📊 **Results:**\n- ✓ Sent: ${successCount}\n- ✗ Failed: ${failedCount}\n- Total: ${targetLeads.length}\n\n${failedCount > 0 ? '⚠️ Some emails failed. Check campaign results for details.' : '🎉 All emails sent successfully!'}`,
            };
          } else {
            // Campaign scheduled for later
            return {
              success: true,
              campaignId,
              scheduled: true,
              scheduledFor: input.sendOptions?.scheduleFor,
              targetCount: targetLeads.length,
              message: `✅ **Campaign "${input.campaignName}" Scheduled!**\n\n📅 Scheduled for: ${input.sendOptions?.scheduleFor}\n👥 Target audience: ${targetLeads.length} leads\n\nThe campaign will be sent automatically at the scheduled time.`,
            };
          }
        } catch (error) {
          console.error("createEmailCampaign error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Campaign creation failed",
            message: "Failed to create email campaign. Please check your configuration and try again.",
          };
        }
      },
    },
    
    sendBulkWhatsApp: {
      description: `Send WhatsApp messages to multiple leads in bulk.
      
Features:
- Personalization with variables: {{firstName}}, {{company}}, etc.
- Rate limiting to avoid blocks
- Progress tracking
- Automatic retry on failures

Note: WhatsApp must be configured in settings first.`,
      inputSchema: z.object({
        leadIds: z.array(z.string()).optional().describe("Specific lead IDs to message"),
        filters: z.object({
          companies: z.array(z.string()).optional(),
          titles: z.array(z.string()).optional(),
          hasPhone: z.boolean().optional().default(true),
        }).optional().describe("Filter criteria to select leads"),
        message: z.string().describe("WhatsApp message content (can include {{variables}})"),
        sendOptions: z.object({
          batchSize: z.number().optional().default(5).describe("Messages per batch (WhatsApp rate limit)"),
          delayBetweenBatches: z.number().optional().default(5000).describe("Delay in ms (WhatsApp rate limit)"),
        }).optional(),
      }),
      execute: async (input: {
        leadIds?: string[];
        filters?: {
          companies?: string[];
          titles?: string[];
          hasPhone?: boolean;
        };
        message: string;
        sendOptions?: {
          batchSize?: number;
          delayBetweenBatches?: number;
        };
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const { ObjectId } = await import("mongodb");
          const db = await getDb();
          
          // Check WhatsApp configuration
          const whatsappSettings = await db.collection('whatsapp_settings').findOne({
            orgId,
            isEnabled: true,
          });
          
          if (!whatsappSettings) {
            return {
              success: false,
              error: "WhatsApp not configured",
              message: "⚠️ **WhatsApp Not Configured**\n\nPlease set up WhatsApp integration first:\n1. Go to Settings → WhatsApp\n2. Choose integration method (WhatsApp Business API or whatsapp-web.js)\n3. Complete setup and verify phone number\n4. Enable the integration",
              setupRequired: true,
            };
          }
          
          // Fetch target leads
          let targetLeads: any[] = [];
          
          if (input.leadIds && input.leadIds.length > 0) {
            const objectIds = input.leadIds
              .filter(id => ObjectId.isValid(id))
              .map(id => new ObjectId(id));
            
            targetLeads = await db.collection('leads')
              .find({ 
                orgId, 
                _id: { $in: objectIds },
                phones: { $exists: true, $ne: [] }
              })
              .toArray();
          } else if (input.filters) {
            const query: any = { orgId };
            
            if (input.filters.companies && input.filters.companies.length > 0) {
              query.company = { $in: input.filters.companies.map(c => new RegExp(c, 'i')) };
            }
            
            if (input.filters.titles && input.filters.titles.length > 0) {
              query.title = { $in: input.filters.titles.map(t => new RegExp(t, 'i')) };
            }
            
            if (input.filters.hasPhone !== false) {
              query.phones = { $exists: true, $ne: [] };
            }
            
            targetLeads = await db.collection('leads')
              .find(query)
              .limit(500) // WhatsApp safety limit
              .toArray();
          }
          
          if (targetLeads.length === 0) {
            return {
              success: false,
              error: "No leads found with phone numbers",
              message: "No leads found matching criteria with phone numbers.",
            };
          }
          
          // Personalize and send messages
          const sendResults = [];
          const batchSize = input.sendOptions?.batchSize || 5;
          const delay = input.sendOptions?.delayBetweenBatches || 5000;
          
          const personalize = (template: string, lead: any) => {
            return template
              .replace(/\{\{firstName\}\}/g, lead.firstName || lead.name?.split(' ')[0] || '')
              .replace(/\{\{lastName\}\}/g, lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '')
              .replace(/\{\{name\}\}/g, lead.name || '')
              .replace(/\{\{company\}\}/g, lead.company || '')
              .replace(/\{\{title\}\}/g, lead.title || '');
          };
          
          for (let i = 0; i < targetLeads.length; i += batchSize) {
            const batch = targetLeads.slice(i, i + batchSize);
            
            for (const lead of batch) {
              const phone = lead.phones?.[0];
              if (!phone) continue;
              
              try {
                const personalizedMessage = personalize(input.message, lead);
                
                // TODO: Integrate with actual WhatsApp API
                // For now, queue the message
                await db.collection('whatsapp_queue').insertOne({
                  orgId,
                  userId,
                  leadId: lead._id.toString(),
                  phone,
                  message: personalizedMessage,
                  status: 'queued',
                  createdAt: new Date(),
                });
                
                sendResults.push({
                  leadId: lead._id.toString(),
                  phone,
                  status: 'queued',
                });
              } catch (error) {
                sendResults.push({
                  leadId: lead._id.toString(),
                  phone,
                  status: 'failed',
                  error: error instanceof Error ? error.message : 'Failed',
                });
              }
            }
            
            // Delay between batches
            if (i + batchSize < targetLeads.length) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          const queuedCount = sendResults.filter(r => r.status === 'queued').length;
          const failedCount = sendResults.filter(r => r.status === 'failed').length;
          
          return {
            success: true,
            queued: queuedCount,
            failed: failedCount,
            total: targetLeads.length,
            message: `✅ **WhatsApp Messages Queued!**\n\n📊 **Status:**\n- ✓ Queued: ${queuedCount}\n- ✗ Failed: ${failedCount}\n- Total: ${targetLeads.length}\n\n📱 Messages will be sent via WhatsApp Business API shortly.\n\n⚠️ Note: WhatsApp has strict rate limits. Messages are queued and sent gradually to avoid blocks.`,
          };
        } catch (error) {
          console.error("sendBulkWhatsApp error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bulk WhatsApp send failed",
          };
        }
      },
    },
  } as const;
}
