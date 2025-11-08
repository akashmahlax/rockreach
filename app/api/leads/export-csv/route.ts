import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('rockreach');

    // Get user's organization ID
    const user = await db.collection('users').findOne({ email: session.user.email });

    const orgId = user?.orgId ? String(user.orgId) : session.user.orgId ?? session.user.email;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch all leads for this organization
    const leads = await db
      .collection('leads')
      .find({ orgId })
      .toArray();

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads to export' }, { status: 404 });
    }

    // Generate CSV content
    const headers = [
      'Person ID',
      'Name',
      'First Name',
      'Last Name',
      'Title',
      'Company',
      'Emails',
      'Phones',
      'LinkedIn',
      'Location',
      'City',
      'State',
      'Country',
      'Tags',
      'Created At',
      'Updated At'
    ];

    const csvRows = [headers.join(',')];

    for (const lead of leads) {
      const row = [
        lead.personId || '',
        escapeCSV(lead.name || ''),
        escapeCSV(lead.first_name || ''),
        escapeCSV(lead.last_name || ''),
        escapeCSV(lead.title || lead.current_title || ''),
        escapeCSV(lead.company || lead.current_employer || ''),
        escapeCSV((lead.emails || []).map((e: { email?: string } | string) => typeof e === 'string' ? e : e.email || '').join('; ')),
        escapeCSV((lead.phones || []).map((p: { number?: string } | string) => typeof p === 'string' ? p : p.number || '').join('; ')),
        lead.linkedin_url || lead.linkedin || '',
        escapeCSV(lead.location || ''),
        escapeCSV(lead.city || ''),
        escapeCSV(lead.state || lead.region || ''),
        escapeCSV(lead.country || ''),
        escapeCSV((lead.tags || []).join('; ')),
        lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        lead.updatedAt ? new Date(lead.updatedAt).toISOString() : ''
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `leads-export-${timestamp}.csv`;

    // Return as downloadable CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    );
  }
}

// Helper function to escape CSV fields
function escapeCSV(field: string): string {
  if (!field) return '';
  // Convert to string and handle null/undefined
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
