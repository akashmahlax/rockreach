# RocketReach Lead Generation System - Usage Guide

## ✅ System Status: 100% Real Data (No Mock Data)

All pages fetch data directly from MongoDB. No mock or placeholder data exists.

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Required:
- Node.js 18+ or Bun
- MongoDB running on mongodb://localhost:27017
- Google OAuth credentials configured in .env.local
```

### 2. Environment Setup

Create `.env.local` in the root directory:

```bash
# Auth.js Configuration
AUTH_SECRET="your-random-secret-key-min-32-chars"
AUTH_TRUST_HOST=true

# Google OAuth (for authentication)
AUTH_GOOGLE_ID="84524660788-8r3a378hgimgh7mqr5f6vl7atrnl307d.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-oauth-secret"

# MongoDB Connection
MONGODB_URI="mongodb://localhost:27017/rockreach"

# Encryption Key (for RocketReach API keys)
APP_MASTER_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"

# Base URL
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start MongoDB

```bash
# Windows (if MongoDB installed as service)
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Install Dependencies

```bash
bun install
# or
npm install
```

### 5. Run Development Server

```bash
bun run dev
# or
npm run dev
```

Visit: http://localhost:3000

---

## 👤 User Roles & Access

### Getting Started (First Time)

1. **Sign in with Google** on homepage
2. **Your role is automatically assigned** via `auth.ts` profile callback
3. **Default role: "user"** (can be changed in MongoDB)

### Making Yourself Admin

Open MongoDB and update your user:

```javascript
// Connect to MongoDB
use rockreach

// Find your user
db.users.findOne({ email: "your-email@gmail.com" })

// Update to admin
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "admin" } }
)

// Verify
db.users.findOne({ email: "your-email@gmail.com" })
```

**Sign out and sign back in** for role to take effect.

---

## 📋 Feature Usage Guide

### 🔐 Admin Features (Admin Role Required)

#### 1. **RocketReach API Configuration**
**Path:** `/admin/settings`

**Steps:**
1. Navigate to Admin > Settings
2. Enter RocketReach API Base URL: `https://api.rocketreach.co`
3. Enter your RocketReach API Key
4. Configure rate limits and retry policies
5. Click "Save Settings"
6. API key is **encrypted with AES-256-GCM** before storage

**Database Collection:** `rocketreach_settings`

---

#### 2. **User Management**
**Path:** `/admin/users`

**View all users:**
- See all registered users
- View their roles (user/admin)
- Check registration dates
- Monitor OAuth provider info

**Database Collection:** `users`

---

#### 3. **API Usage Monitoring**
**Path:** `/admin/api-usage`

**Real-time statistics:**
- ✅ Today's API calls (real data)
- ✅ This week's usage (real data)
- ✅ All-time total (real data)
- ✅ Success rate percentage (real data)
- ✅ Top 10 endpoints with call counts (real aggregation)
- ✅ Recent 100 API calls with timestamps (real data)

**Database Collection:** `api_usage`

**How data is tracked:**
- Every RocketReach API call logs to `api_usage` collection
- Tracked fields: endpoint, method, status, duration, orgId, userId
- Uses MongoDB aggregation pipelines for statistics

---

#### 4. **Audit Logs**
**Path:** `/admin/audit-logs`

**View all system activities:**
- ✅ Real audit trail of all actions
- User actions (searches, lookups, imports, exports)
- Timestamps and actor information
- Metadata about each action

**Database Collection:** `audit_logs`

**Logged actions:**
- `search_leads` - Lead searches
- `lookup_linkedin_profile` - LinkedIn enrichment
- `save_lead` - Lead saves
- `import_leads_csv` - CSV imports
- `update_rocketreach_settings` - Settings changes

---

#### 5. **Organizations Management**
**Path:** `/admin/organizations`

**View and manage:**
- ✅ All organizations (real data)
- User counts per organization
- Plan types and status
- API quotas
- Creation dates

**Database Collection:** `organizations`

---

### 👥 User Features

#### 6. **Lead Search**
**Path:** `/leads/search`

**Two search methods:**

**A. LinkedIn URL Lookup** (✅ New Feature!)
1. Paste LinkedIn profile URL: `https://linkedin.com/in/profile-name`
2. Click "Lookup" button
3. System validates URL format
4. Calls RocketReach API: `lookupProfile({ linkedin_url })`
5. **Automatically saves** lead to database
6. Tracks API usage
7. Creates audit log
8. Shows result in table immediately

**B. Text-based Search**
1. Enter search criteria:
   - Name (e.g., "John Doe")
   - Title (e.g., "CEO")
   - Company (e.g., "Acme Inc")
   - Domain (e.g., "example.com")
   - Location (e.g., "New York, NY")
2. Click "Search Leads"
3. Calls RocketReach API: `search({ name, title, company, ... })`
4. Results appear in table
5. Use "Save" button to save individual leads

**Database Collections:**
- `leads` - Saved leads
- `lead_searches` - Search history
- `api_usage` - API call tracking

---

#### 7. **My Leads**
**Path:** `/leads`

**Features:**
- ✅ View all saved leads (real data from MongoDB)
- Search leads (local filter)
- **Export to CSV** (✅ New!)
- **Import from CSV** (✅ New!)

**Database Collection:** `leads`

**Stats shown (real calculations):**
- Total leads count
- Leads with emails count
- Leads with phones count
- Verified contacts count

---

#### 8. **CSV Export**
**Location:** My Leads page > "Export" button

**What it does:**
1. Fetches ALL leads for your organization from MongoDB
2. Generates CSV with 16 columns:
   - Person ID, Name, First Name, Last Name
   - Title, Company
   - Emails (semicolon-separated)
   - Phones (semicolon-separated)
   - LinkedIn URL
   - Location, City, State, Country
   - Tags (semicolon-separated)
   - Created At, Updated At
3. Downloads file: `leads-export-YYYY-MM-DDTHH-MM-SS.csv`

**API Endpoint:** `GET /api/leads/export-csv`

---

#### 9. **CSV Import**
**Location:** My Leads page > "Import" button

**How to use:**
1. Click "Import" button
2. Select CSV file or drag & drop
3. System validates:
   - File must be .csv
   - Email format validation
   - Required fields check (name)
4. Shows progress indicator
5. Displays results:
   - Number of leads imported
   - Number of failed rows
   - Error details (first 10)

**Supported CSV columns:**
```csv
name,first_name,last_name,title,company,email,emails,phone,phones,linkedin,linkedin_url,location,city,state,country,tags
```

**API Endpoint:** `POST /api/leads/import-csv`

**Database:**
- Bulk inserts into `leads` collection
- Creates audit log in `audit_logs`

---

#### 10. **Lead Lists**
**Path:** `/leads/lists`

**Create and manage lists:**
- ✅ Create named lists (real data)
- Add descriptions
- Organize leads by campaigns/segments
- Track lead counts

**Database Collection:** `lead_lists`

---

## 🗄️ Database Collections

All data is stored in MongoDB database: `rockreach`

### Collections Overview:

```
rockreach/
├── users                  # User accounts (OAuth + role)
├── leads                  # All saved leads
├── lead_lists            # Organized lead collections
├── lead_searches         # Search history
├── api_usage             # RocketReach API tracking
├── audit_logs            # System activity audit trail
├── rocketreach_settings  # Encrypted API configuration
└── organizations         # Multi-tenant organization data
```

### Sample Data Structures:

**users:**
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  name: "John Doe",
  image: "https://...",
  role: "admin" | "user",
  orgId: "default",
  emailVerified: Date,
  createdAt: Date
}
```

**leads:**
```javascript
{
  _id: ObjectId,
  personId: "rocketreach-id",
  name: "Jane Smith",
  first_name: "Jane",
  last_name: "Smith",
  title: "VP of Sales",
  company: "Tech Corp",
  emails: ["jane@techcorp.com"],
  phones: ["+1-555-0123"],
  linkedin_url: "https://linkedin.com/in/janesmith",
  location: "San Francisco, CA",
  tags: ["prospect", "enterprise"],
  orgId: "default",
  createdAt: Date,
  updatedAt: Date
}
```

**api_usage:**
```javascript
{
  _id: ObjectId,
  orgId: "default",
  provider: "rocketreach",
  endpoint: "/v2/api/search",
  method: "POST",
  units: 1,
  status: "success",
  durationMs: 423,
  error: null,
  createdAt: Date
}
```

**audit_logs:**
```javascript
{
  _id: ObjectId,
  action: "lookup_linkedin_profile",
  target: "leads",
  targetId: "lead-id",
  actorId: "user-id",
  actorEmail: "user@example.com",
  meta: { linkedinUrl: "https://...", ... },
  orgId: "default",
  timestamp: Date
}
```

---

## 🔧 RocketReach API Integration

### How It Works:

1. **Configuration** (Admin Settings):
   - API key stored **encrypted** in MongoDB
   - Settings cached for 60 seconds to reduce DB queries

2. **API Client** (`lib/rocketreach.ts`):
   - Automatic retry logic with exponential backoff
   - Rate limit handling (429, 503)
   - Concurrent request management
   - **Automatic usage logging** to `api_usage` collection

3. **Available Methods:**
   ```typescript
   // Search for people
   rrSearchPeople(orgId, { name, title, company, location })
   
   // Lookup by person ID
   rrLookupProfile(orgId, personId)
   
   // Lookup by LinkedIn URL (new!)
   // Called via: /api/leads/lookup-linkedin
   
   // Lookup email
   rrLookupEmail(orgId, { name, domain })
   
   // Bulk lookup
   rrBulkLookup(orgId, [id1, id2, ...])
   ```

4. **Every API call automatically:**
   - Logs to `api_usage` collection
   - Tracks: endpoint, duration, status, errors
   - Creates audit log for user actions
   - Updates organization quotas (if configured)

---

## 🔒 Security Features

### 1. **Authentication**
- Google OAuth via Auth.js v5
- Session-based authentication
- Role stored in session (`user.role`)

### 2. **Authorization**
- Page-level role checks (no middleware)
- Admin pages: `if (role !== "admin") redirect("/dashboard")`
- API routes validate session before execution

### 3. **Encryption**
- RocketReach API keys encrypted with **AES-256-GCM**
- Master key from environment: `APP_MASTER_KEY`
- Encrypted data includes IV and auth tag

### 4. **Audit Trail**
- All user actions logged
- Immutable audit log
- Tracks: who, what, when, metadata

---

## 📊 Monitoring & Analytics

### Admin Dashboard (`/admin`)
✅ All real data:
- Total users count
- Total leads count
- API calls today
- Recent activity feed

### API Usage Dashboard (`/admin/api-usage`)
✅ All real MongoDB aggregations:
- Today's calls with success rate and avg duration
- Weekly totals
- All-time statistics
- Top 10 endpoints by volume
- Last 100 API calls with full details

### User Dashboard (`/dashboard`)
✅ Personalized real data:
- User's lead count
- Recent searches
- Quick action buttons

---

## 🐛 Troubleshooting

### "Unauthorized" errors
- **Solution:** Sign out and sign back in
- Check MongoDB user role is set correctly
- Verify session is active

### No data showing
- **Check:** MongoDB is running
- **Verify:** Database name is `rockreach`
- **Ensure:** Collections exist (created automatically on first write)

### RocketReach API errors
1. Go to `/admin/settings`
2. Verify API key is correct
3. Check RocketReach account has credits
4. View `/admin/api-usage` for error details

### CSV Import fails
- **Check:** CSV has header row
- **Verify:** Email format is valid
- **Ensure:** At least name or first_name/last_name exists
- **Review:** Error messages in import result dialog

---

## 📈 Production Deployment

### Required Environment Variables:
```bash
AUTH_SECRET=<generate-random-32+char-string>
AUTH_GOOGLE_ID=<your-google-oauth-client-id>
AUTH_GOOGLE_SECRET=<your-google-oauth-secret>
MONGODB_URI=<production-mongodb-connection-string>
APP_MASTER_KEY=<generate-random-64-char-hex-string>
NEXTAUTH_URL=<your-production-url>
AUTH_TRUST_HOST=true
```

### Build & Deploy:
```bash
# Build for production
bun run build
# or
npm run build

# Start production server
bun start
# or
npm start
```

### MongoDB Setup:
```bash
# Create indexes for performance
use rockreach

db.users.createIndex({ email: 1 }, { unique: true })
db.leads.createIndex({ orgId: 1, createdAt: -1 })
db.api_usage.createIndex({ orgId: 1, createdAt: -1 })
db.audit_logs.createIndex({ orgId: 1, timestamp: -1 })
```

---

## ✅ Verification Checklist

**All pages use real MongoDB data:**
- [x] `/` - Landing page (role-aware)
- [x] `/dashboard` - User dashboard (real stats)
- [x] `/leads` - My Leads (real leads from DB)
- [x] `/leads/search` - Lead search (real RocketReach API)
- [x] `/leads/lists` - Lead lists (real lists from DB)
- [x] `/admin` - Admin dashboard (real aggregated stats)
- [x] `/admin/settings` - RocketReach config (real encrypted keys)
- [x] `/admin/users` - User management (real users)
- [x] `/admin/api-usage` - API monitoring (real usage data)
- [x] `/admin/audit-logs` - Audit logs (real audit trail)
- [x] `/admin/organizations` - Organizations (real org data)

**All API endpoints functional:**
- [x] `POST /api/leads/search` - RocketReach search
- [x] `POST /api/leads/save` - Save lead to DB
- [x] `POST /api/leads/lookup-linkedin` - LinkedIn enrichment
- [x] `GET /api/leads/export-csv` - CSV export
- [x] `POST /api/leads/import-csv` - CSV import
- [x] `POST /api/admin/rocketreach-settings` - Update settings

**No mock data anywhere!** 🎉

---

## 📞 Support & Next Steps

### Current Features:
✅ LinkedIn URL Lookup
✅ CSV Import/Export
✅ Real-time API Usage Tracking
✅ Audit Logging
✅ Role-based Access Control
✅ Encrypted API Key Storage

### Coming Soon (from TODO list):
- Bulk lead operations (delete, tag, export selected)
- Advanced filtering system
- Lead tagging with color labels
- Lead scoring algorithm
- Email verification integration
- CRM integrations (Salesforce, HubSpot)
- Duplicate detection
- Analytics dashboard

---

**Last Updated:** November 8, 2025
**Version:** 1.0.0
**Database:** MongoDB (100% Real Data)
**No Mock Data:** Confirmed ✅
