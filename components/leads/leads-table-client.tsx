'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, Phone, Mail, Linkedin as LinkedinIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ObjectId } from 'mongodb';

interface Lead {
  _id?: ObjectId;
  name?: string;
  title?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  createdAt?: Date;
}

interface LeadWithSort extends Lead {
  hasPhone: boolean;
  hasEmail: boolean;
}

type SortField = 'name' | 'company' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface LeadsTableClientProps {
  initialLeads: Lead[];
}

export function LeadsTableClient({ initialLeads }: LeadsTableClientProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Newest first by default
  const [filterPhone, setFilterPhone] = useState(false);
  const [filterEmail, setFilterEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enhance leads with computed properties
  const enhancedLeads: LeadWithSort[] = useMemo(() => 
    initialLeads.map(lead => ({
      ...lead,
      hasPhone: !!(lead.phones && lead.phones.length > 0),
      hasEmail: !!(lead.emails && lead.emails.length > 0),
    })),
    [initialLeads]
  );

  // Apply filters and sorting
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = enhancedLeads;

    // Filter by phone if enabled
    if (filterPhone) {
      filtered = filtered.filter(lead => lead.hasPhone);
    }

    // Filter by email if enabled
    if (filterEmail) {
      filtered = filtered.filter(lead => lead.hasEmail);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.title?.toLowerCase().includes(query) ||
        lead.emails?.some(e => e.toLowerCase().includes(query)) ||
        lead.phones?.some(p => p.includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'company':
          comparison = (a.company || '').localeCompare(b.company || '');
          break;
        case 'createdAt':
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [enhancedLeads, sortField, sortOrder, filterPhone, filterEmail, searchQuery]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const stats = useMemo(() => ({
    total: enhancedLeads.length,
    withPhone: enhancedLeads.filter(l => l.hasPhone).length,
    withEmail: enhancedLeads.filter(l => l.hasEmail).length,
    withBoth: enhancedLeads.filter(l => l.hasPhone && l.hasEmail).length,
  }), [enhancedLeads]);

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search by name, company, email, phone..."
            className="bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterPhone ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPhone(!filterPhone)}
          >
            <Phone className="w-4 h-4 mr-2" />
            {filterPhone ? 'With Phone' : 'All'}
          </Button>
          <Button 
            variant={filterEmail ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterEmail(!filterEmail)}
          >
            <Mail className="w-4 h-4 mr-2" />
            {filterEmail ? 'With Email' : 'All'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSort('createdAt')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {sortField === 'createdAt' && sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            <ArrowUpDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAndSortedLeads.length} of {stats.total} leads
        {(filterPhone || filterEmail || searchQuery) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2"
            onClick={() => {
              setFilterPhone(false);
              setFilterEmail(false);
              setSearchQuery('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredAndSortedLeads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {stats.total === 0 
              ? 'No leads saved yet' 
              : 'No leads match your filters'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    Name
                    {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  <button
                    onClick={() => toggleSort('company')}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    Company
                    {sortField === 'company' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  <LinkedinIcon className="w-4 h-4 inline mr-1" />
                  LinkedIn
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium">
                  Date Added
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLeads.map((lead, index) => {
                const leadId = lead._id?.toString();
                const formattedDate = lead.createdAt 
                  ? new Date(lead.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })
                  : 'N/A';

                return (
                  <tr
                    key={leadId ?? index}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium">
                      {lead.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {lead.title || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {lead.company || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.hasPhone ? (
                        <a 
                          href={`tel:${lead.phones![0]}`}
                          className="text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phones![0]}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.hasEmail ? (
                        <a 
                          href={`mailto:${lead.emails![0]}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {lead.emails![0]}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {lead.linkedin ? (
                        <a 
                          href={lead.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkedinIcon className="w-3 h-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formattedDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
