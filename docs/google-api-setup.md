# Google API Setup Guide

**Estimated Time:** 20-30 minutes
**Purpose:** Enable Google Workspace integrations for Discord bot

**⚠️ Note:** Some steps reference privacy policy and terms of service URLs. Since this is a private bot for personal use, you can use placeholder URLs (`https://sunny-stack.com/privacy` and `https://sunny-stack.com/terms`) during setup. These pages aren't strictly required for private/testing use.

---

## Overview

Your Discord bot needs access to 8 Google APIs:

1. **Gmail API** - Monitor client emails, send notifications
2. **Google Drive API** - Manage project files and proposals
3. **Google Calendar API** - Sync calendar events, send reminders
4. **Google Sheets API** - Export reports, track time entries
5. **Google Docs API** - Generate proposals from templates
6. **Google Tasks API** - Sync tasks with Discord
7. **People API (Contacts)** - Access client contact information
8. **Google Analytics API** - Track website metrics

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** dropdown (top bar)
3. Click **NEW PROJECT**
4. Enter project details:
   - **Project name:** `Sunny Stack Bot`
   - **Organization:** (leave default or select yours)
   - **Location:** (leave default or select yours)
5. Click **CREATE**
6. Wait for project creation (~30 seconds)
7. Switch to the new project (click notification or select from dropdown)

---

## Step 2: Enable Required APIs

### Quick Enable (Recommended)

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search and enable each API:

**Enable these 8 APIs:**

```
Gmail API
Google Drive API
Google Calendar API
Google Sheets API
Google Docs API
Google Tasks API
People API
Google Analytics API
```

For each API:

1. Search for the API name
2. Click on the API card
3. Click **ENABLE**
4. Wait for activation (~10 seconds)
5. Repeat for all 8 APIs

### Verification

After enabling all APIs, verify at [APIs & Services > Dashboard](https://console.cloud.google.com/apis/dashboard):

- You should see all 8 APIs listed as "Enabled"

---

## Step 3: Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen.

1. Go to [APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **External** user type (unless you have Google Workspace)
3. Click **CREATE**

### App Information

Fill in the required fields:

- **App name:** `Sunny Stack Bot`
- **User support email:** Your Google email
- **App logo:** (optional - upload if desired)
- **Application home page:** `https://sunny-stack.com`
- **Application privacy policy link:** `https://sunny-stack.com/privacy` (create later)
- **Application terms of service link:** `https://sunny-stack.com/terms` (create later)
- **Authorized domains:** `sunny-stack.com`
- **Developer contact information:** Your email

Click **SAVE AND CONTINUE**

### Scopes

Add the following OAuth scopes (click **ADD OR REMOVE SCOPES**):

**Gmail API:**

- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails

**Google Drive API:**

- `https://www.googleapis.com/auth/drive.file` - Manage Drive files
- `https://www.googleapis.com/auth/drive.metadata.readonly` - Read metadata

**Google Calendar API:**

- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events
- `https://www.googleapis.com/auth/calendar.events` - Create/edit events

**Google Sheets API:**

- `https://www.googleapis.com/auth/spreadsheets` - Create/edit spreadsheets

**Google Docs API:**

- `https://www.googleapis.com/auth/documents` - Create/edit documents

**Google Tasks API:**

- `https://www.googleapis.com/auth/tasks` - Manage tasks

**People API:**

- `https://www.googleapis.com/auth/contacts.readonly` - Read contacts

**Google Analytics API:**

- `https://www.googleapis.com/auth/analytics.readonly` - Read Analytics data

Click **UPDATE** → **SAVE AND CONTINUE**

### Test Users

Since your app is in "External" mode and not published, add yourself as a test user:

1. Click **ADD USERS**
2. Enter your Google email address
3. Click **ADD**
4. Click **SAVE AND CONTINUE**

### Summary

Review the summary and click **BACK TO DASHBOARD**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** (top bar)
3. Select **OAuth client ID**

### Configure OAuth Client

- **Application type:** Web application
- **Name:** `Sunny Stack Bot - Web Client`

### Authorized JavaScript origins

Add these origins:

```
http://localhost:3000
https://sunny-stack.com
```

### Authorized redirect URIs

Add these redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://sunny-stack.com/api/auth/callback/google
```

Click **CREATE**

### Save Credentials

A modal will appear with your credentials:

1. **Client ID** - Copy this (starts with `xxxxx.apps.googleusercontent.com`)
2. **Client secret** - Copy this

⚠️ **Save these immediately!** You'll need them for your `.env.local` file.

Click **DOWNLOAD JSON** (optional - for backup)

---

## Step 5: Obtain Refresh Token

Now you need to get a refresh token through the OAuth flow.

### Option A: Using OAuth Playground (Easiest)

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click ⚙️ (settings icon) in the top-right
3. Check **Use your own OAuth credentials**
4. Enter your **OAuth Client ID** and **OAuth Client secret**
5. Close settings

6. On the left, select all the scopes you enabled:
   - Gmail API v1 (select readonly and send scopes)
   - Drive API v3 (select file and metadata.readonly)
   - Calendar API v3 (select readonly and events)
   - Sheets API v4 (select spreadsheets)
   - Docs API v1 (select documents)
   - Tasks API v1 (select tasks)
   - People API v1 (select contacts.readonly)
   - Analytics API v3 (select analytics.readonly)

7. Click **Authorize APIs** button
8. Sign in with your Google account
9. Click **Allow** for all permissions
10. You'll be redirected back to OAuth Playground
11. Click **Exchange authorization code for tokens**
12. **Copy the Refresh token** - This is your `GOOGLE_REFRESH_TOKEN`

⚠️ **Save this refresh token securely!** It allows long-term API access.

### Option B: Using Custom Script (Advanced)

Create a file `tools/google-oauth-flow.js`:

```javascript
const { google } = require("googleapis");
const http = require("http");
const url = require("url");
const open = require("open");

const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "http://localhost:3000/oauth2callback",
);

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

console.log("Authorize this app by visiting:", authUrl);
open(authUrl);

const server = http
  .createServer(async (req, res) => {
    if (req.url.indexOf("/oauth2callback") > -1) {
      const qs = new url.URL(req.url, "http://localhost:3000").searchParams;
      const code = qs.get("code");
      res.end("Authentication successful! Please return to the console.");
      server.close();

      const { tokens } = await oauth2Client.getToken(code);
      console.log("\n✅ Refresh Token:", tokens.refresh_token);
      console.log("\nAdd this to your .env.local:");
      console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    }
  })
  .listen(3000, () => {
    console.log("Listening on port 3000...");
  });
```

Run:

```bash
npm install googleapis open
node tools/google-oauth-flow.js
```

---

## Step 6: Update Environment Variables

Add these to your `.env.local`:

```bash
# Google OAuth & APIs
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
GOOGLE_REFRESH_TOKEN="your-refresh-token-from-step-5"
GOOGLE_PROJECT_ID="sunny-stack-bot"
```

---

## Step 7: Test API Access

Create a test script `tools/test-google-apis.js`:

```javascript
const { google } = require("googleapis");
require("dotenv").config({ path: ".env.local" });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function testAPIs() {
  try {
    // Test Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarResponse = await calendar.calendarList.list();
    console.log(
      "✅ Calendar API:",
      calendarResponse.data.items.length,
      "calendars found",
    );

    // Test Gmail API
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const gmailResponse = await gmail.users.labels.list({ userId: "me" });
    console.log(
      "✅ Gmail API:",
      gmailResponse.data.labels.length,
      "labels found",
    );

    // Test Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const driveResponse = await drive.files.list({ pageSize: 10 });
    console.log(
      "✅ Drive API:",
      driveResponse.data.files.length,
      "files found",
    );

    console.log("\n🎉 All Google APIs working correctly!");
  } catch (error) {
    console.error("❌ Error testing APIs:", error.message);
  }
}

testAPIs();
```

Run test:

```bash
node tools/test-google-apis.js
```

Expected output:

```
✅ Calendar API: 3 calendars found
✅ Gmail API: 12 labels found
✅ Drive API: 10 files found

🎉 All Google APIs working correctly!
```

---

## Troubleshooting

### Error: "Access Not Configured"

- API not enabled in Google Cloud Console
- Go to APIs & Services > Library and enable the API

### Error: "Invalid Client"

- Client ID or secret is incorrect
- Double-check `.env.local` values
- Regenerate credentials if needed

### Error: "Redirect URI Mismatch"

- Redirect URI in `.env.local` doesn't match Google Cloud Console
- Add exact URI to Authorized redirect URIs

### Error: "Access Denied"

- User not added as test user (External app mode)
- Add your email in OAuth consent screen > Test users

### Error: "Token has been expired or revoked"

- Refresh token invalid
- Repeat Step 5 to get new refresh token

### Error: "Insufficient Permission"

- Required scope not granted during OAuth flow
- Revoke app access in Google Account settings
- Repeat Step 5 with all required scopes

---

## API Quotas & Limits

### Daily Quotas (Free Tier)

- **Gmail API:** 1,000,000,000 quota units/day (1 read = 5 units)
- **Drive API:** 1,000,000,000 queries/day
- **Calendar API:** 1,000,000 queries/day
- **Sheets API:** 500 requests/100 seconds per user
- **Docs API:** 300 requests/minute per user
- **Tasks API:** 50,000 requests/day
- **People API:** 600 requests/minute per user
- **Analytics API:** 50,000 requests/day

### Rate Limits

Most APIs have per-user rate limits:

- **100 queries per 100 seconds** (average)
- **1,000 queries per 100 seconds** (burst)

### Monitoring Quotas

View quota usage at: [APIs & Services > Dashboard](https://console.cloud.google.com/apis/dashboard)

---

## Security Best Practices

1. **Never commit credentials** - Keep `.env.local` in `.gitignore`
2. **Use refresh tokens** - Don't store access tokens long-term
3. **Rotate secrets regularly** - Regenerate credentials quarterly
4. **Monitor API usage** - Watch for unusual activity
5. **Limit scopes** - Only request permissions you need
6. **Use service accounts for server-side** - Consider service accounts for production

---

## Next Steps

1. ✅ Save all credentials to `.env.local`
2. ✅ Test API access with test script
3. ✅ Verify quotas are sufficient for your usage
4. ⏳ Proceed to Task 0.4 (Configuration Files)
5. ⏳ Implement Google API wrappers in Phase 1.5

---

**Setup Status:** Complete Google OAuth and API setup
**Time Taken:** ~20-30 minutes
**Next Task:** Task 0.4 - Configuration File Creation
