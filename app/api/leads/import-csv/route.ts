import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '@/lib/db';
import { createAuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('rockreach');

    // Get user's organization ID
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a CSV file.' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Parse CSV header
    const headers = parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));

    // Process rows
    const leads: Array<Record<string, unknown>> = [];
    const errors: Array<{ row: number; error: string }> = [];
    const orgId = user.orgId || session.user.email;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};

        // Map values to headers
        for (let j = 0; j < headers.length && j < values.length; j++) {
          const key = normalizedHeaders[j];
          const value = values[j]?.trim();
          if (value) {
            row[key] = value;
          }
        }

        // Validate required fields
        if (!row.name && !row.first_name && !row.last_name) {
          errors.push({ row: i + 1, error: 'Missing name' });
          continue;
        }

        // Validate email format if provided
        const emailValue = row.email || row.emails;
        if (emailValue) {
          const emails = emailValue.split(';').map(e => e.trim()).filter(Boolean);
          const invalidEmails = emails.filter(e => !isValidEmail(e));
          if (invalidEmails.length > 0) {
            errors.push({ row: i + 1, error: `Invalid email format: ${invalidEmails.join(', ')}` });
            continue;
          }
        }

        // Build lead object
        const lead = {
          name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          first_name: row.first_name,
          last_name: row.last_name,
          title: row.title,
          company: row.company,
          emails: emailValue ? emailValue.split(';').map(e => e.trim()).filter(Boolean) : [],
          phones: (row.phone || row.phones) ? (row.phone || row.phones)!.split(';').map(p => p.trim()).filter(Boolean) : [],
          linkedin_url: row.linkedin || row.linkedin_url,
          location: row.location,
          city: row.city,
          state: row.state,
          country: row.country,
          tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
          orgId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        leads.push(lead);
      } catch (error) {
        errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Parse error' });
      }
    }

    // Bulk insert leads
    let insertedCount = 0;
    if (leads.length > 0) {
      const result = await db.collection('leads').insertMany(leads);
      insertedCount = result.insertedCount;
    }

    // Create audit log
    await createAuditLog({
      action: 'import_leads_csv',
      target: 'leads',
      targetId: undefined,
      actorId: user._id?.toString() || undefined,
      actorEmail: session.user.email,
      meta: {
        filename: file.name,
        totalRows: lines.length - 1,
        imported: insertedCount,
        errors: errors.length,
      },
      orgId,
    });

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
      message: `Successfully imported ${insertedCount} leads. ${errors.length > 0 ? `${errors.length} rows failed.` : ''}`,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
