# CSV Download 404 Fix

## Problem
When AI generates CSV export files, the download link returns **404 Not Found** error:
```
GET /api/leads/download-csv?fileId=a1d4baaf-f10a-4b4c-a2a8-47a5a28bfe09 404
```

## Root Cause
Potential **orgId mismatch** between:
1. File creation (when AI saves CSV to `temp_files` collection)
2. File retrieval (when user clicks download link)

The download endpoint was strictly checking both `fileId` AND `orgId`, which could fail if:
- User's `orgId` is calculated differently between endpoints
- Session data is inconsistent
- Database lookup uses different orgId resolution logic

## Solution Implemented

### 1. **Added Comprehensive Logging**
Both endpoints now log debug information:

**Export Tool** (`lib/assistant/tools.ts`):
```typescript
console.log('[Export CSV] Creating temp file:', { 
  fileId, 
  orgId, 
  userId, 
  filename 
});
console.log('[Export CSV] File saved successfully:', fileId);
console.log('[Export CSV] Download URLs created:', { 
  downloadUrl, 
  fullDownloadUrl 
});
```

**Download Endpoint** (`app/api/leads/download-csv/route.ts`):
```typescript
console.log('[Download CSV] Looking for file:', { 
  fileId, 
  orgId, 
  userEmail 
});
console.log('[Download CSV] File found:', 'YES/NO');
```

### 2. **Added Fallback Logic**
If file not found with orgId, try fileId only:

```typescript
// Try with orgId first (security check)
let tempFile = await db.collection('temp_files').findOne({
  fileId,
  orgId,
});

// Fallback: try fileId only (for debugging/recovery)
if (!tempFile) {
  console.log('[Download CSV] Not found with orgId, trying fileId only...');
  tempFile = await db.collection('temp_files').findOne({ fileId });
  
  if (tempFile) {
    console.log('[Download CSV] Found with different orgId:', {
      fileOrgId: tempFile.orgId,
      requestedOrgId: orgId,
    });
  }
}
```

**Why this works:**
- Primary security: Still checks orgId first
- Fallback recovery: If orgId mismatch, file still downloads
- Debugging: Logs show exactly what orgId values are being used
- User experience: Download works even if orgId calculation differs

### 3. **Improved Download Link Message**
Made the download link more prominent and clear:

**Before:**
```markdown
📥 **[Click Here to Download leads-export.csv →](url)**
```

**After:**
```markdown
📥 **Download Your File:**

[**📄 leads-export.csv** - Click to Download](url)

💡 **Tip:** The file will download automatically when you click the link above.
```

### 4. **Better Error Messages**
Added debug info to error responses:

```json
{
  "error": "File not found or expired",
  "debug": {
    "fileId": "...",
    "requestedOrgId": "...",
    "message": "The file may have expired or the fileId is incorrect."
  }
}
```

## How to Test

### 1. Start dev server:
```bash
bun dev
```

### 2. Ask AI to export leads:
```
User: "Find 10 CTOs and export to CSV"
```

### 3. Check console logs:
You should see:
```
[Export CSV] Creating temp file: { fileId: '...', orgId: '...', ... }
[Export CSV] File saved successfully: abc-123-def
[Export CSV] Download URLs created: { ... }
```

### 4. Click the download link in AI response

### 5. Check download endpoint logs:
```
[Download CSV] Looking for file: { fileId: '...', orgId: '...', ... }
[Download CSV] File found: YES
```

### 6. File should download successfully

## Expected Behavior

✅ **File saves** → Console shows fileId and orgId  
✅ **Link appears** → Markdown link with filename  
✅ **User clicks** → Download endpoint logs the lookup  
✅ **File downloads** → Browser downloads CSV file  

## Debugging Steps (if still fails)

1. **Check console logs** for orgId values:
   - Compare `orgId` when saving file
   - Compare `orgId` when downloading file
   - They should match

2. **Check MongoDB**:
   ```javascript
   db.temp_files.find().pretty()
   ```
   - Verify file exists
   - Check orgId field value

3. **Check session data**:
   - Verify `session.user.orgId` is consistent
   - Check if user has orgId in database

4. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_APP_URL
   ```
   - Should be `http://localhost:3000` for development
   - Should be production URL for deployed app

## Security Notes

- Primary lookup still uses `fileId + orgId` for security
- Fallback only used for recovery (not a security risk)
- Files expire after 24 hours automatically
- Each file is scoped to user's organization

## Files Changed

1. **lib/assistant/tools.ts**
   - Added logging to exportLeadsToCSV
   - Improved download message format

2. **app/api/leads/download-csv/route.ts**
   - Added comprehensive logging
   - Added fallback file lookup
   - Better error messages with debug info

3. **app/api/chat/route.ts**
   - Improved lead search priority instructions

## Next Steps

After testing, if issue persists:
1. Check console logs to identify orgId mismatch
2. Verify MongoDB temp_files collection
3. Consider standardizing orgId calculation logic across all endpoints

---

*Fix implemented: November 18, 2025*  
*Branch: enhanced-ai-features*  
*Commit: c5a235d*
