import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getDefaultEmailProvider, type EmailProviderSettings } from '@/models/ProviderSettings';
import { ObjectId } from 'mongodb';

export interface EmailClient {
  send: (params: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }) => Promise<{ id: string; success: boolean }>;
  providerInfo: {
    type: string;
    fromEmail: string;
    fromName: string;
  };
}

export async function getEmailProvider(orgId: string, providerId?: string): Promise<EmailClient> {
  const provider = providerId
    ? await getEmailProviderById(orgId, providerId)
    : await getDefaultEmailProvider(orgId);

  if (!provider) {
    throw new Error('No email provider configured');
  }

  const { provider: providerType, apiKey, smtpConfig, fromEmail, fromName } = provider as EmailProviderSettings;

  const providerInfo = {
    type: providerType,
    fromEmail,
    fromName,
  };

  if (providerType === 'resend' && apiKey) {
    const resend = new Resend(apiKey);
    return {
      send: async (params) => {
        const result = await resend.emails.send({
          from: params.from,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        });
        return { id: result.data?.id || 'unknown', success: true };
      },
      providerInfo,
    };
  }

  if (providerType === 'sendgrid' && apiKey) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: apiKey },
    });
    return {
      send: async (params) => {
        const info: nodemailer.SentMessageInfo = await transporter.sendMail({
          from: params.from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        });
        return { id: String(info.messageId || ''), success: true };
      },
      providerInfo,
    };
  }

  if (providerType === 'smtp' && smtpConfig) {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.password },
    });
    return {
      send: async (params) => {
        const info: nodemailer.SentMessageInfo = await transporter.sendMail({
          from: params.from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        });
        return { id: String(info.messageId || ''), success: true };
      },
      providerInfo,
    };
  }

  if (providerType === 'mailgun' && apiKey) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: { user: smtpConfig?.user || 'postmaster@your-domain.com', pass: apiKey },
    });
    return {
      send: async (params) => {
        const info: nodemailer.SentMessageInfo = await transporter.sendMail({
          from: params.from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        });
        return { id: String(info.messageId || ''), success: true };
      },
      providerInfo,
    };
  }

  throw new Error(`Email provider ${providerType} not properly configured`);
}

async function getEmailProviderById(orgId: string, providerId: string) {
  const { getDb, Collections } = await import('@/lib/db');
  const db = await getDb();
  return db.collection(Collections.EMAIL_PROVIDERS).findOne({
    _id: new ObjectId(providerId),
    organizationId: orgId,
  });
}
 
