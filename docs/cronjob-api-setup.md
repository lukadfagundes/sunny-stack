# cron-job.org API Setup Guide

**Estimated Time:** 5-10 minutes
**Purpose:** Enable bot to monitor external cron jobs and scheduled tasks

---

## Prerequisites

- ✅ cron-job.org account (free or paid)
- ✅ Active cron jobs configured
- ✅ Access to cron-job.org dashboard

---

## Overview

Your Discord bot will monitor cron-job.org for:

- **Job Execution Status** - Success/failure of scheduled tasks
- **Execution History** - Recent job runs and results
- **Downtime Alerts** - Jobs that failed or didn't run
- **Performance Metrics** - Average execution time
- **Schedule Verification** - Ensure jobs are running on schedule

---

## Step 1: Create cron-job.org Account

If you don't have an account yet:

1. Go to https://cron-job.org/
2. Click **"Sign up"**
3. Choose plan:
   - **Free:** 3 jobs, 1-minute resolution
   - **Plus ($4.99/mo):** 25 jobs, 1-minute resolution, notifications
   - **Professional ($9.99/mo):** 100 jobs, 1-minute resolution, priority support
4. Verify email address

---

## Step 2: Create API Key

### 2.1 Navigate to API Settings

1. Log in to [cron-job.org](https://cron-job.org/)
2. Click your **username** (top-right)
3. Select **"Account"** from dropdown
4. Click **"API"** tab (or go to: https://cron-job.org/en/members/api/)

### 2.2 Generate API Key

1. Scroll to **"API Key"** section
2. Click **"Generate new API key"** or **"Show API key"**
3. **Copy the API key** immediately

**Format:**

```
API Key: abcd1234efgh5678ijkl9012mnop3456
```

4. **Save to `.env.local`:**

```bash
CRONJOB_API_KEY=abcd1234efgh5678ijkl9012mnop3456
```

5. **Save to password manager** (backup)

⚠️ **Note:** cron-job.org allows regenerating the API key, but old keys are immediately revoked.

---

## Step 3: Get Your Job IDs

You need to identify which cron jobs to monitor.

### 3.1 From Dashboard

1. Go to [cron-job.org Dashboard](https://cron-job.org/en/members/)
2. View your **"Cronjobs"** list
3. Click on each job to see details
4. Copy the **Job ID** (numeric ID in URL: `cronjobs/{job_id}`)

**Example:**

```
Job 1: Database Backup (ID: 12345)
Job 2: Send Daily Digest (ID: 67890)
Job 3: Clear Cache (ID: 54321)
```

### 3.2 Using API

Or fetch all jobs via API:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.cron-job.org/jobs
```

Response includes job IDs, titles, and URLs.

---

## Step 4: Test API Access

### Create Test Script

Create `tools/test-cronjob-api.js`:

```javascript
const axios = require("axios");
require("dotenv").config({ path: ".env.local" });

const CRONJOB_API_KEY = process.env.CRONJOB_API_KEY;

const cronJobAPI = axios.create({
  baseURL: "https://api.cron-job.org",
  headers: {
    Authorization: `Bearer ${CRONJOB_API_KEY}`,
    "Content-Type": "application/json",
  },
});

async function testCronJobAPI() {
  try {
    console.log("🧪 Testing cron-job.org API access...\n");

    // Test 1: List all jobs
    const jobsResponse = await cronJobAPI.get("/jobs");

    if (!jobsResponse.data.jobs || jobsResponse.data.jobs.length === 0) {
      console.log(
        "⚠️  No cron jobs found. Create jobs first at https://cron-job.org/",
      );
      return;
    }

    console.log("✅ API Access: Success");
    console.log(`✅ Cron Jobs Found: ${jobsResponse.data.jobs.length}\n`);

    console.log("📅 Your Cron Jobs:");
    jobsResponse.data.jobs.forEach((job) => {
      console.log(`\n   Job ID: ${job.jobId}`);
      console.log(`   Title: ${job.title}`);
      console.log(`   URL: ${job.url}`);
      console.log(`   Enabled: ${job.enabled ? "✅" : "❌"}`);
      console.log(
        `   Schedule: ${job.schedule.hours.join(",")}:${job.schedule.minutes.join(",")} (${job.schedule.timezone})`,
      );
    });

    // Test 2: Get execution history for first job
    if (jobsResponse.data.jobs.length > 0) {
      const firstJobId = jobsResponse.data.jobs[0].jobId;
      const historyResponse = await cronJobAPI.get(
        `/jobs/${firstJobId}/history`,
      );

      console.log(
        `\n📊 Recent Executions (Job: ${jobsResponse.data.jobs[0].title}):`,
      );

      if (
        historyResponse.data.history &&
        historyResponse.data.history.length > 0
      ) {
        historyResponse.data.history.slice(0, 5).forEach((execution) => {
          const status = execution.status === 1 ? "✅" : "❌";
          const date = new Date(execution.date * 1000).toLocaleString();
          console.log(
            `   ${status} ${date} - Duration: ${execution.duration}ms - Status: ${execution.httpStatus || "N/A"}`,
          );
        });
      } else {
        console.log("   No execution history yet.");
      }
    }

    console.log("\n🎉 cron-job.org API setup complete!");
  } catch (error) {
    console.error("❌ Error testing cron-job.org API:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data?.error?.message || error.response.statusText}`,
      );
    } else {
      console.error(`   ${error.message}`);
    }

    if (error.response?.status === 401) {
      console.error(
        "\n💡 Tip: Check that CRONJOB_API_KEY in .env.local is correct",
      );
    }

    process.exit(1);
  }
}

testCronJobAPI();
```

### Run Test

```bash
npm install axios  # If not already installed
node tools/test-cronjob-api.js
```

### Expected Output

```
🧪 Testing cron-job.org API access...

✅ API Access: Success
✅ Cron Jobs Found: 3

📅 Your Cron Jobs:

   Job ID: 12345
   Title: Database Backup
   URL: https://sunny-stack.com/api/cron/backup
   Enabled: ✅
   Schedule: 2:0 (America/New_York)

   Job ID: 67890
   Title: Send Daily Digest
   URL: https://sunny-stack.com/api/cron/digest
   Enabled: ✅
   Schedule: 8:0 (America/New_York)

   Job ID: 54321
   Title: Clear Cache
   URL: https://sunny-stack.com/api/cron/clear-cache
   Enabled: ✅
   Schedule: */6:0 (America/New_York)

📊 Recent Executions (Job: Database Backup):
   ✅ 10/28/2025, 2:00:15 AM - Duration: 1234ms - Status: 200
   ✅ 10/27/2025, 2:00:12 AM - Duration: 1156ms - Status: 200
   ✅ 10/26/2025, 2:00:18 AM - Duration: 1298ms - Status: 200
   ❌ 10/25/2025, 2:00:10 AM - Duration: 5002ms - Status: 500
   ✅ 10/24/2025, 2:00:14 AM - Duration: 1187ms - Status: 200

🎉 cron-job.org API setup complete!
```

---

## Step 5: Configure Bot Monitoring

### Discord Channel Mapping

Cron job alerts will be sent to:

```bash
# Successful cron executions (optional, can be verbose)
CRONJOB_SUCCESS_CHANNEL_ID=same-as-DISCORD_CHANNEL_ADMIN_LOGS

# Failed cron executions (important!)
CRONJOB_FAILURE_CHANNEL_ID=same-as-DISCORD_CHANNEL_CLIENT_INQUIRIES
```

### Environment Variables Summary

Add these to your `.env.local`:

```bash
# Required
CRONJOB_API_KEY=abcd1234efgh5678ijkl9012mnop3456

# Optional (configure via bot commands instead)
CRONJOB_JOBS_TO_MONITOR=12345,67890,54321
CRONJOB_CHECK_INTERVAL=300000  # Check every 5 minutes (in ms)
CRONJOB_ALERT_ON_SUCCESS=false  # Only alert on failures
```

---

## Step 6: Bot Monitoring Features

### What the Bot Will Monitor

1. **Execution Status** - Success/failure of each job run
2. **Missed Executions** - Jobs that should have run but didn't
3. **Slow Executions** - Jobs exceeding expected duration
4. **HTTP Errors** - Non-200 status codes
5. **Schedule Changes** - Detect if job schedule was modified

### Automated Alerts

Bot sends Discord notifications for:

- ❌ **Job Failed** - HTTP error, timeout, or crash
- ⚠️ **Job Slow** - Execution time >5 seconds
- 🔴 **Job Missed** - Expected execution didn't occur
- 🔧 **Schedule Changed** - Cron schedule modified
- ✅ **Job Recovered** - Previously failing job now succeeds (optional)

### Slash Commands (Once Implemented)

```
/cronjob list                    # List all monitored jobs
/cronjob status <job-id>         # Get job status
/cronjob history <job-id>        # View execution history
/cronjob enable <job-id>         # Enable a job
/cronjob disable <job-id>        # Disable a job
/cronjob test <job-id>           # Manually trigger job
```

---

## Troubleshooting

### Error: "Unauthorized" (401)

- API key is invalid or expired
- Regenerate API key in cron-job.org dashboard
- Verify no extra spaces in `.env.local`

### Error: "Not Found" (404)

- Job ID doesn't exist
- Job was deleted
- Check job IDs in dashboard

### No Jobs Returned

- Account has no cron jobs configured
- Create jobs first: https://cron-job.org/en/members/jobs/add/
- Free plan limited to 3 jobs

### Rate Limit Errors

- cron-job.org API has rate limits
- Bot checks every 5 minutes by default (configurable)
- Don't poll too frequently (<1 minute intervals)

---

## API Rate Limits

**cron-job.org API Limits:**

- **Free Plan:** ~60 requests/hour
- **Paid Plans:** Higher limits

**Bot Usage Estimate:**

- Job list: 1 request/5 minutes (~288/day)
- History checks: 1 request/job/5 minutes (~864/day for 3 jobs)
- **Total:** ~1,152 requests/day

Stays within limits with 5-minute polling ✅

---

## Security Best Practices

1. **Never commit API key** - Keep in `.env.local` (gitignored)
2. **Use HTTPS endpoints** - All cron job URLs should use HTTPS
3. **Verify signatures** - Add authentication to your cron endpoints
4. **Rotate regularly** - Regenerate API key every 6-12 months
5. **Monitor unusual activity** - Check execution logs for anomalies
6. **Rate limit your endpoints** - Prevent abuse of cron endpoints

---

## Setting Up Cron Job Endpoints

Your cron jobs should call API endpoints on your Next.js app:

### Example: Database Backup Cron

**Create API endpoint:** `app/api/cron/backup/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

// Verify cron-job.org request
const CRONJOB_SECRET = process.env.CRONJOB_ENDPOINT_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRONJOB_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Perform backup
    console.log("Running database backup...");
    // ... backup logic here ...

    return NextResponse.json({
      success: true,
      message: "Backup completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
```

**Configure in cron-job.org:**

- **URL:** `https://sunny-stack.com/api/cron/backup`
- **Method:** GET
- **Headers:** `Authorization: Bearer your-secret-token`
- **Schedule:** Daily at 2:00 AM
- **Timeout:** 30 seconds

---

## Next Steps

1. ✅ Add `CRONJOB_API_KEY` to `.env.local`
2. ✅ Test API access with test script
3. ✅ Create cron job endpoints in Next.js
4. ✅ Configure jobs in cron-job.org dashboard
5. ⏳ Complete Phase 0 environment configuration
6. ⏳ Implement bot monitoring logic in Phase 3

---

## Additional Resources

- **cron-job.org Dashboard:** https://cron-job.org/en/members/
- **API Documentation:** https://api.cron-job.org/documentation/
- **Support:** https://cron-job.org/en/support/
- **Cron Syntax Guide:** https://crontab.guru/

---

**Setup Status:** Complete cron-job.org API Integration
**Time Taken:** ~5-10 minutes
**All External Service APIs Configured!** ✅

**Next:** Complete Discord bot setup and finalize Phase 0
