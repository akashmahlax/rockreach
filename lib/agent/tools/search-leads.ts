import { z } from 'zod';
import { rrLookupProfile, rrSearchPeople } from '@/lib/rocketreach';

type RrPeopleSearchResponse = {
  profiles?: unknown[];
  pagination?: { total?: number };
};

export const searchLeadsTool = {
  description: `Search for leads using RocketReach API. You can search by company name and role, or by LinkedIn URL. Returns contact information including emails and phone numbers.`,
  inputSchema: z.object({
    orgId: z.string().describe('Organization ID for RocketReach settings'),
    searchType: z.enum(['people', 'personId']).describe('Type of search to perform'),
    companyName: z.string().optional().describe('Company name to search (for people search)'),
    role: z.string().optional().describe('Job title or role to search for (for people search)'),
    personId: z.string().optional().describe('RocketReach person ID (for profile lookup)'),
    limit: z.number().min(1).max(50).default(10).describe('Maximum number of results'),
  }),
  execute: async ({ orgId, searchType, companyName, role, personId, limit }: { orgId: string; searchType: 'people' | 'personId'; companyName?: string; role?: string; personId?: string; limit?: number; }) => {
    try {
      if (searchType === 'personId' && personId) {
        const profile = await rrLookupProfile(orgId, personId);
        return {
          success: true,
          searchType,
          results: [profile],
          count: 1,
        };
      }

      if (searchType === 'people') {
        // Search for people by company and role
        if (!companyName) {
          return {
            success: false,
            error: 'Company name is required for people search',
          };
        }

        const results: RrPeopleSearchResponse = await rrSearchPeople(orgId, {
          company: companyName,
          title: role,
          page_size: limit,
        });

        return {
          success: true,
          searchType,
          results: results?.profiles || [],
          count: results?.profiles?.length || 0,
          totalResults: results?.pagination?.total || 0,
        };
      }

      return {
        success: false,
        error: 'Invalid search type or missing required parameters',
      };
    } catch (error) {
      console.error('Lead search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search leads',
      };
    }
  },
} as const;
