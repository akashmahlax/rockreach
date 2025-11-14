import { z } from 'zod';
import { getDb, Collections } from '@/lib/db';

export function createSaveLeadTool(orgId: string, userId: string) {
  return {
    description: `Save a lead to the database. Use this to store contact information for people you've found during research. Provide the lead's details.`,
    inputSchema: z.object({
      email: z.string().email().describe('Lead email address'),
      firstName: z.string().describe('First name'),
      lastName: z.string().describe('Last name'),
      company: z.string().optional().describe('Company name'),
      title: z.string().optional().describe('Job title'),
      linkedinUrl: z.string().url().optional().describe('LinkedIn profile URL'),
      phone: z.string().optional().describe('Phone number'),
      location: z.string().optional().describe('Location/city'),
      notes: z.string().optional().describe('Any additional notes about this lead'),
      tags: z.array(z.string()).optional().describe('Tags to categorize this lead'),
    }),
    execute: async (leadData: {
      email: string;
      firstName: string;
      lastName: string;
      company?: string;
      title?: string;
      linkedinUrl?: string;
      phone?: string;
      location?: string;
      notes?: string;
      tags?: string[];
    }) => {
      try {
        const db = await getDb();
        
        // Check if lead already exists
        const existingLead = await db.collection(Collections.LEADS).findOne({
          organizationId: orgId,
          email: leadData.email,
        });

        if (existingLead) {
          // Update existing lead
          await db.collection(Collections.LEADS).updateOne(
            { _id: existingLead._id },
            {
              $set: {
                ...leadData,
                updatedAt: new Date(),
                lastContactedAt: new Date(),
              },
            }
          );

          return {
            success: true,
            leadId: existingLead._id,
            action: 'updated',
            message: `Lead ${leadData.firstName} ${leadData.lastName} updated successfully`,
          };
        }

        // Create new lead
        const newLead = {
          organizationId: orgId,
          userId,
          ...leadData,
          status: 'new',
          source: 'ai-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection(Collections.LEADS).insertOne(newLead);

        return {
          success: true,
          leadId: result.insertedId,
          action: 'created',
          message: `Lead ${leadData.firstName} ${leadData.lastName} saved successfully`,
        };
      } catch (error) {
        console.error('Save lead error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save lead',
        };
      }
    },
  } as const;
}
