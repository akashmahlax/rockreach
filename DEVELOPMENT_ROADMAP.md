# Logician Development Roadmap

## ✅ Completed
- [x] Unified navigation system with role-based access
- [x] UI rebranding to "Logician"
- [x] Theme support (dark/light mode)
- [x] Placeholder pages for all features
- [x] AI SDK dependencies installed

## 🚀 Phase 1: AI-Powered Email System (Priority)

### 1.1 Email Template Generation with AI
**Goal**: Generate personalized email templates using AI SDK

**Tasks**:
- [ ] Create `/email/templates` implementation
  - AI-powered template generator using `generateText`
  - Template CRUD operations (MongoDB)
  - Variable placeholder system ({{firstName}}, {{company}}, etc.)
  - Template categories/tags
- [ ] Create API route `/api/email/generate-template`
  - Use AI SDK `generateText` with structured prompts
  - Accept: target audience, tone, purpose
  - Return: subject line + email body with variables
- [ ] Add template preview with mock data
- [ ] Implement template versioning

**Database Schema**:
```typescript
interface EmailTemplate {
  _id: ObjectId;
  userId: string;
  organizationId: string;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // ['firstName', 'company', 'position']
  tone: 'professional' | 'casual' | 'friendly' | 'formal';
  category: string;
  tags: string[];
  generatedByAI: boolean;
  aiPrompt?: string; // Original prompt used for generation
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 SMTP Configuration
**Goal**: Allow users to configure their email sending accounts

**Tasks**:
- [ ] Build `/email/settings` page
  - SMTP server configuration form
  - OAuth integration for Gmail/Outlook
  - Test connection functionality
  - Multiple email account support
- [ ] Create `SMTPSettings` model with encryption
- [ ] API routes for SMTP CRUD operations
- [ ] Email sending service (`lib/email-sender.ts`)

**Database Schema**:
```typescript
interface SMTPSettings {
  _id: ObjectId;
  userId: string;
  organizationId: string;
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid';
  displayName: string;
  fromEmail: string;
  fromName: string;
  // Encrypted fields:
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string; // AES-256-GCM encrypted
  oauthToken?: string; // For OAuth providers
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.3 AI Email Campaign Builder
**Goal**: Create campaigns with AI-generated personalized emails

**Tasks**:
- [ ] Build `/email/campaigns/new` page
  - Campaign settings (name, from address, schedule)
  - Lead list selection
  - AI generation interface with tone/style options
  - Preview with personalized variables
  - A/B testing configuration
- [ ] Create `EmailCampaign` model
- [ ] API route `/api/email/campaigns` (CRUD)
- [ ] API route `/api/email/personalize` - AI SDK to personalize per lead
  - Use `streamText` for real-time generation
  - Access lead data for personalization
- [ ] Campaign scheduling system
- [ ] Email queue management

**Database Schema**:
```typescript
interface EmailCampaign {
  _id: ObjectId;
  userId: string;
  organizationId: string;
  name: string;
  templateId?: ObjectId;
  subject: string;
  body: string;
  fromEmailId: ObjectId; // Reference to SMTPSettings
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  leadListIds: ObjectId[];
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  aiGenerated: boolean;
  aiPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 Email Response Tracking
**Goal**: Track and display email responses in unified inbox

**Tasks**:
- [ ] Build `/email/inbox` page
  - Spreadsheet-style view of all sent emails
  - Response status indicators
  - Lead information alongside emails
  - Filter/search functionality
  - Quick reply interface
- [ ] Create webhook endpoint for email provider callbacks
- [ ] Implement email parsing for replies
- [ ] Link responses to original campaigns and leads
- [ ] Real-time status updates

**Database Schema**:
```typescript
interface EmailTracking {
  _id: ObjectId;
  campaignId: ObjectId;
  leadId: ObjectId;
  userId: string;
  organizationId: string;
  messageId: string; // Email provider message ID
  subject: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  bounced: boolean;
  bouncedReason?: string;
  status: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  replyText?: string;
  replyFrom?: string;
  metadata: Record<string, any>;
}
```

## 📊 Phase 2: Bulk Lead Enrichment

### 2.1 Bulk Upload Interface
**Goal**: Upload companies and roles to enrich leads in bulk

**Tasks**:
- [ ] Build `/leads/bulk` page
  - CSV upload component with validation
  - Manual company + role input form
  - Role/designation selector with autocomplete
  - Bulk processing queue display
  - Results table with export
- [ ] CSV parser and validator
- [ ] API route `/api/leads/bulk-upload`
- [ ] Background job processing system
- [ ] Progress tracking and notifications

**Expected CSV Format**:
```csv
company_name,target_roles
"Acme Corp","CEO,CTO,VP Marketing"
"TechStart Inc","Head of Engineering,Product Manager"
```

### 2.2 Batch Lead Enrichment
**Goal**: Process bulk uploads and fetch lead data

**Tasks**:
- [ ] Batch processing engine
- [ ] Integration with lead API (existing `lib/rocketreach.ts`)
- [ ] Rate limiting and retry logic
- [ ] Result aggregation and export
- [ ] Email notification on completion

**Database Schema**:
```typescript
interface BulkUploadJob {
  _id: ObjectId;
  userId: string;
  organizationId: string;
  fileName: string;
  totalCompanies: number;
  processedCompanies: number;
  totalLeadsFound: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors: Array<{ company: string; error: string }>;
  resultFileUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

## 🔍 Phase 3: Advanced Search

### 3.1 Company + Niche + Designation Search
**Goal**: Multi-criteria search for precise lead discovery

**Tasks**:
- [ ] Build `/leads/advanced-search` page
  - Company name autocomplete
  - Industry/niche category dropdown
  - Designation/seniority filters
  - Location filters
  - Company size filters
  - Save search functionality
- [ ] API route `/api/leads/advanced-search`
- [ ] Search result caching
- [ ] Saved searches management

**Database Schema**:
```typescript
interface SavedSearch {
  _id: ObjectId;
  userId: string;
  name: string;
  filters: {
    companyName?: string;
    industry?: string[];
    designations?: string[];
    location?: string[];
    companySize?: string[];
  };
  lastRun?: Date;
  resultCount?: number;
  createdAt: Date;
}
```

## 📚 Phase 4: Documentation & Platform Guide

### 4.1 Create Documentation Pages
**Tasks**:
- [ ] `/docs/guide` - Platform usage guide
- [ ] `/docs/api` - API integration documentation
- [ ] `/docs/bulk-upload` - Bulk upload workflow
- [ ] `/docs/email-outreach` - Email campaign best practices

## 🛠️ Technical Infrastructure

### API Integration Strategy
1. **Existing Lead API**: Keep using current integration for individual searches
2. **Bulk Operations**: Implement queue-based processing with rate limiting
3. **Caching**: Add Redis for search results and lead data caching

### AI SDK Integration Points
1. **Email Templates**: `generateText` with custom prompts
2. **Email Personalization**: `streamText` for real-time generation
3. **Lead Research**: Use AI to analyze LinkedIn profiles and suggest talking points
4. **Subject Line Optimization**: Generate and A/B test subject lines

### Database Collections Needed
- `email_templates`
- `smtp_settings`
- `email_campaigns`
- `email_tracking`
- `bulk_upload_jobs`
- `saved_searches`

## 🎯 Recommended Development Order

### Week 1-2: Email Foundation
1. Email template generation (AI SDK integration)
2. SMTP settings and configuration
3. Basic email sending functionality

### Week 3-4: Campaign System
1. Campaign builder with AI personalization
2. Campaign scheduling and queue
3. Email tracking setup

### Week 5-6: Response Tracking & Inbox
1. Webhook integration for responses
2. Inbox interface
3. Analytics dashboard

### Week 7-8: Bulk Operations
1. Bulk upload interface
2. Background processing
3. Export functionality

### Week 9-10: Advanced Search & Polish
1. Advanced search implementation
2. Saved searches
3. Documentation pages
4. Testing and refinement

## 🔐 Environment Variables Needed

Add to `.env.local`:
```env
# AI SDK
OPENAI_API_KEY=sk-...

# Email (Optional - for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (for queue management)
REDIS_URL=redis://localhost:6379
```

## 📝 Next Immediate Steps

1. ✅ Install AI SDK dependencies (DONE)
2. Set up OpenAI API key in `.env.local`
3. Create AI-powered email template generator
4. Build SMTP configuration interface
5. Implement basic campaign creation

Would you like to start with the Email Template Generator using AI SDK?
