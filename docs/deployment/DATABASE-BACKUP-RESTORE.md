# Database Backup & Restore Guide

**Project:** Sunny Stack
**Database:** PostgreSQL 15 (Self-Hosted on Raspberry Pi)
**Version:** 1.0.0
**Last Updated:** 2025-11-06

---

## Table of Contents

- [Overview](#overview)
- [Automated Backup System](#automated-backup-system)
- [Manual Backup](#manual-backup)
- [Verify Backup Integrity](#verify-backup-integrity)
- [Restore from Backup](#restore-from-backup)
- [Cloud Storage Access](#cloud-storage-access)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)
- [Disaster Recovery Checklist](#disaster-recovery-checklist)

---

## Overview

### Backup Strategy

- **Frequency:** Daily at 2:00 AM (automated via cron)
- **Method:** pg_dump (full database dump)
- **Compression:** gzip (9x compression)
- **Storage:** Local Pi + Cloud (Google Drive via rclone)
- **Retention:** Local 7 days, Cloud 30 days
- **Verification:** Automatic size verification after upload

### Why Backups Matter

- **Data Loss Prevention:** Hardware failures, corruption, accidental deletions
- **Disaster Recovery:** Complete system restoration capability
- **Compliance:** Data retention requirements for client projects
- **Peace of Mind:** Confidence in data integrity

### Backup Architecture

```
┌─────────────────────────────────────┐
│      Raspberry Pi (2:00 AM)         │
│  ┌──────────────────────────────┐   │
│  │  Cron Job Triggers Backup    │   │
│  │  scripts/backup-database.sh  │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  PostgreSQL pg_dump          │   │
│  │  → sunnystack_YYYYMMDD.sql   │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  gzip Compression            │   │
│  │  → .sql.gz (90% smaller)     │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  Local Storage (7 days)      │   │
│  │  /home/pi/backups/           │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  rclone Upload               │   │
│  │  → Google Drive (30 days)    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Automated Backup System

### How It Works

1. **Cron Job** runs daily at 2:00 AM on Raspberry Pi
2. **Backup Script** (`scripts/backup-database.sh`) executes:
   - Checks disk space and PostgreSQL connectivity
   - Creates pg_dump of entire database
   - Compresses with gzip (9x compression)
   - Uploads to Google Drive via rclone
   - Verifies cloud backup integrity
   - Cleans up old backups (local: 7 days, cloud: 30 days)
   - Logs all operations
3. **Optional Email Notification** on success/failure

### Cron Schedule

```bash
# View current cron jobs
crontab -l

# Expected entry:
0 2 * * * /home/pi/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1
```

**Translation:** At 2:00 AM every day, run backup script and log output to `/var/log/db-backup-cron.log`

### Log Files

- **Success Log:** `/var/log/db-backup.log` - All backup operations
- **Error Log:** `/var/log/db-backup-error.log` - Errors only
- **Cron Log:** `/var/log/db-backup-cron.log` - Cron execution logs

**View recent logs:**

```bash
# Last 50 lines of backup log
tail -50 /var/log/db-backup.log

# Last 50 lines of error log
tail -50 /var/log/db-backup-error.log

# View today's backups
grep "$(date +%Y-%m-%d)" /var/log/db-backup.log
```

---

## Manual Backup

Use manual backup when:

- Testing backup system
- Before major database changes
- Before system maintenance
- On-demand backup needed

### Quick Manual Backup

```bash
# SSH to Raspberry Pi
ssh pi@raspberry-pi.local

# Run backup script manually
/home/pi/scripts/backup-database.sh

# Verify backup created
ls -lh /home/pi/backups/
```

### Manual Backup (Without Script)

If backup script is unavailable, create backup manually:

```bash
# Set variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/pi/backups"
DB_NAME="sunnystack"
DB_USER="sunnystack"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/sunnystack_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/sunnystack_$TIMESTAMP.sql"

# Upload to cloud
rclone copy "$BACKUP_DIR/sunnystack_$TIMESTAMP.sql.gz" gdrive:backups/sunnystack/

# Verify
ls -lh "$BACKUP_DIR/sunnystack_$TIMESTAMP.sql.gz"
rclone ls gdrive:backups/sunnystack/ | grep $TIMESTAMP
```

---

## Verify Backup Integrity

**IMPORTANT:** Always verify backups before you need them!

### Quick Verification

```bash
# SSH to Pi
ssh pi@raspberry-pi.local

# List recent backups
ls -lh /home/pi/backups/

# Check if today's backup exists
ls -lh /home/pi/backups/sunnystack_$(date +%Y%m%d)*.sql.gz

# View backup log
tail -20 /var/log/db-backup.log
```

### Comprehensive Verification

Test restore to temporary database to ensure backup is valid:

```bash
# 1. Download latest backup from cloud
LATEST_BACKUP=$(rclone lsf gdrive:backups/sunnystack/ | sort -r | head -1)
rclone copy "gdrive:backups/sunnystack/$LATEST_BACKUP" ./
echo "Downloaded: $LATEST_BACKUP"

# 2. Decompress
gunzip "$LATEST_BACKUP"
BACKUP_FILE="${LATEST_BACKUP%.gz}"

# 3. Create temporary test database
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -c "CREATE DATABASE sunnystack_test;"

# 4. Restore to test database
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack_test < "$BACKUP_FILE"

# 5. Verify data
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack_test -c "
    SELECT
      (SELECT COUNT(*) FROM quotes) AS quote_count,
      (SELECT COUNT(*) FROM projects) AS project_count,
      (SELECT COUNT(*) FROM proposals) AS proposal_count;
  "

# 6. Clean up test database
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -c "DROP DATABASE sunnystack_test;"

rm -f "$BACKUP_FILE"

echo "✅ Backup verification complete!"
```

### Monthly Verification Checklist

Perform these checks on the 1st of each month:

- [ ] Verify automated backup ran successfully (check logs)
- [ ] Verify backup exists in cloud storage
- [ ] Test restore to temporary database (steps above)
- [ ] Verify backup size is reasonable (not corrupted)
- [ ] Check disk space on Pi (`df -h`)
- [ ] Review retention policy (30 days cloud, 7 days local)

---

## Restore from Backup

### ⚠️ CRITICAL WARNINGS

**BEFORE YOU RESTORE:**

1. **Restoring WILL DELETE all current data**
2. **Stop the Discord bot** to prevent writes during restore
3. **Have a recent backup** of current state (if recovering from corruption)
4. **Document the reason** for restoration (for records)
5. **Notify team** (if applicable) about downtime

### Full Database Restoration

**Use Case:** Complete system failure, data corruption, or migration

```bash
# =========================================
# STEP 1: Stop Discord Bot
# =========================================
ssh pi@raspberry-pi.local
cd ~/sunny-stack
docker compose -f docker-compose.prod.yml stop discord-bot

# =========================================
# STEP 2: Download Backup from Cloud
# =========================================
# List available backups
rclone lsf gdrive:backups/sunnystack/ | sort -r

# Download specific backup (replace YYYYMMDD_HHMMSS with actual timestamp)
rclone copy gdrive:backups/sunnystack/sunnystack_YYYYMMDD_HHMMSS.sql.gz ./

# Or download latest
LATEST_BACKUP=$(rclone lsf gdrive:backups/sunnystack/ | sort -r | head -1)
rclone copy "gdrive:backups/sunnystack/$LATEST_BACKUP" ./
echo "Downloaded: $LATEST_BACKUP"

# Decompress
gunzip sunnystack_*.sql.gz

# =========================================
# STEP 3: Backup Current Database (Safety)
# =========================================
# Create emergency backup of current state BEFORE restore
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U sunnystack sunnystack > "emergency_backup_$TIMESTAMP.sql"
gzip "emergency_backup_$TIMESTAMP.sql"
echo "Emergency backup saved: emergency_backup_$TIMESTAMP.sql.gz"

# =========================================
# STEP 4: Drop and Recreate Database
# =========================================
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -c "DROP DATABASE IF EXISTS sunnystack;"

docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -c "CREATE DATABASE sunnystack;"

echo "✅ Database dropped and recreated"

# =========================================
# STEP 5: Restore from Backup
# =========================================
BACKUP_FILE=$(ls sunnystack_*.sql | head -1)
echo "Restoring from: $BACKUP_FILE"

docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack < "$BACKUP_FILE"

echo "✅ Database restored"

# =========================================
# STEP 6: Verify Restoration
# =========================================
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack -c "
    SELECT
      'Quotes' AS table_name, COUNT(*) AS row_count FROM quotes
    UNION ALL
    SELECT 'Projects', COUNT(*) FROM projects
    UNION ALL
    SELECT 'Proposals', COUNT(*) FROM proposals
    UNION ALL
    SELECT 'TimeEntries', COUNT(*) FROM time_entries;
  "

echo "✅ Data counts verified"

# =========================================
# STEP 7: Run Migrations (if needed)
# =========================================
# If restoring to newer codebase version
docker compose -f docker-compose.prod.yml exec -T discord-bot \
  npx prisma migrate deploy

# =========================================
# STEP 8: Restart Discord Bot
# =========================================
docker compose -f docker-compose.prod.yml up -d discord-bot

# Wait for bot to start
sleep 10

# Check bot health
curl http://localhost:8080/health

# =========================================
# STEP 9: Verify Bot Connection
# =========================================
docker compose -f docker-compose.prod.yml logs -f discord-bot --tail=50

# Look for: "Bot ready and operational" or "Connected to Discord Gateway"

echo "✅ Restoration complete!"
```

### Restore Specific Tables Only

**Use Case:** Only certain tables corrupted, rest of data is fine

```bash
# Download and decompress backup (steps 1-2 above)

# Restore specific table(s)
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack -c "TRUNCATE TABLE quotes CASCADE;"

# Extract and restore only quotes table
grep -A 10000 "COPY public.quotes" sunnystack_*.sql | \
  grep -B 1 "COPY public." | head -n -1 | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U sunnystack -d sunnystack

# Verify
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -d sunnystack -c "SELECT COUNT(*) FROM quotes;"
```

### Recovery Time Objective (RTO)

**Expected restoration time:**

- **Small database (<1GB):** 5-10 minutes
- **Medium database (1-5GB):** 10-30 minutes
- **Large database (5-10GB):** 30-60 minutes

**Breakdown:**

1. Download backup: 2-5 minutes
2. Drop/recreate database: 1 minute
3. Restore data: 2-20 minutes (depends on size)
4. Verify + restart: 2-5 minutes

---

## Cloud Storage Access

### rclone Configuration

**Initial Setup (One-Time):**

```bash
# Install rclone on Raspberry Pi
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive remote
rclone config

# Follow prompts:
# - New remote
# - Name: gdrive
# - Storage: Google Drive
# - Client ID/Secret: (optional - leave blank for defaults)
# - Scope: drive (full access)
# - Root folder: (leave blank)
# - Service account: No
# - Advanced config: No
# - Auto config: No (headless setup)
# - Follow URL and paste verification code

# Test connection
rclone lsf gdrive:
```

**Common rclone Commands:**

```bash
# List all backups
rclone lsf gdrive:backups/sunnystack/

# List backups with sizes and dates
rclone ls gdrive:backups/sunnystack/

# Download specific backup
rclone copy gdrive:backups/sunnystack/sunnystack_20251106_020000.sql.gz ./

# Download latest backup
LATEST=$(rclone lsf gdrive:backups/sunnystack/ | sort -r | head -1)
rclone copy "gdrive:backups/sunnystack/$LATEST" ./

# Upload backup manually
rclone copy ./my-backup.sql.gz gdrive:backups/sunnystack/

# Delete old backups (older than 30 days)
rclone delete gdrive:backups/sunnystack/ --min-age 30d

# Check storage usage
rclone size gdrive:backups/sunnystack/
```

### Alternative: Google Drive Web Interface

1. Open [Google Drive](https://drive.google.com)
2. Navigate to `backups/sunnystack/` folder
3. Sort by "Last modified" to find recent backups
4. Right-click → Download

---

## Monitoring & Maintenance

### Daily Monitoring

**Check if today's backup succeeded:**

```bash
ssh pi@raspberry-pi.local

# Check for today's backup
ls -lh /home/pi/backups/sunnystack_$(date +%Y%m%d)*.sql.gz

# View last backup log entry
tail -20 /var/log/db-backup.log
```

**Expected log output:**

```
[2025-11-06 02:00:15] ==========================================
[2025-11-06 02:00:15] Starting database backup
[2025-11-06 02:00:15] ==========================================
[2025-11-06 02:00:16] Disk space check: 45GB available
[2025-11-06 02:00:16] PostgreSQL connection verified
[2025-11-06 02:00:16] rclone remote 'gdrive' verified
[2025-11-06 02:00:17] Creating database dump: /home/pi/backups/sunnystack_20251106_020015.sql
[2025-11-06 02:00:25] ✅ Database dump created successfully: 12M
[2025-11-06 02:00:25] Compressing backup...
[2025-11-06 02:00:27] ✅ Backup compressed successfully: 1.3M
[2025-11-06 02:00:27] Uploading to cloud storage: gdrive:backups/sunnystack
[2025-11-06 02:00:28] Upload attempt 1/3...
[2025-11-06 02:00:42] ✅ Backup uploaded to cloud storage
[2025-11-06 02:00:42] Verifying cloud backup...
[2025-11-06 02:00:43] ✅ Cloud backup verified (size matches: 1.3M)
[2025-11-06 02:00:43] Cleaning up old backups...
[2025-11-06 02:00:44] Deleted 2 old local backup(s) (older than 7 days)
[2025-11-06 02:00:48] ==========================================
[2025-11-06 02:00:48] Backup Summary:
[2025-11-06 02:00:48]   Database: sunnystack
[2025-11-06 02:00:48]   Backup file: sunnystack_20251106_020015.sql.gz
[2025-11-06 02:00:48]   Compressed size: 1.3M
[2025-11-06 02:00:48]   Local path: /home/pi/backups/sunnystack_20251106_020015.sql.gz
[2025-11-06 02:00:48]   Cloud status: ✅ Uploaded
[2025-11-06 02:00:48]   Retention: Local 7d / Cloud 30d
[2025-11-06 02:00:48] ==========================================
[2025-11-06 02:00:48] ✅ Backup completed successfully
```

### Weekly Maintenance

- Check disk space: `df -h /home/pi/backups`
- Verify cloud storage: `rclone size gdrive:backups/sunnystack/`
- Review error logs: `cat /var/log/db-backup-error.log`

### Monthly Maintenance

- Test full restoration (see [Verify Backup Integrity](#verify-backup-integrity))
- Review backup retention policy
- Clean up old logs: `sudo truncate -s 0 /var/log/db-backup.log`

---

## Troubleshooting

### Backup Script Not Running

**Symptoms:**

- No backup created today
- Empty cron log
- Cron job not in `crontab -l`

**Diagnosis:**

```bash
# Check if cron service is running
sudo systemctl status cron

# Check crontab
crontab -l

# Check script permissions
ls -l /home/pi/scripts/backup-database.sh

# Check cron log
tail -50 /var/log/db-backup-cron.log
```

**Solutions:**

```bash
# 1. Restart cron service
sudo systemctl restart cron

# 2. Re-add cron job
crontab -e
# Add: 0 2 * * * /home/pi/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1

# 3. Fix script permissions
chmod +x /home/pi/scripts/backup-database.sh

# 4. Test script manually
/home/pi/scripts/backup-database.sh
```

---

### Upload to Cloud Fails

**Symptoms:**

- Backup created locally but not in cloud
- "Upload attempt 1/3 failed" in logs
- "All upload attempts failed" error

**Diagnosis:**

```bash
# Test rclone connection
rclone lsf gdrive:

# Check network connectivity
ping -c 3 8.8.8.8

# Check rclone config
rclone config show
```

**Solutions:**

```bash
# 1. Reconfigure rclone remote
rclone config reconnect gdrive:

# 2. Test upload manually
rclone copy /home/pi/backups/test.txt gdrive:backups/sunnystack/

# 3. Check Google Drive quota
rclone about gdrive:

# 4. Update rclone
sudo rclone selfupdate
```

---

### Restoration Fails

**Symptoms:**

- "psql: error: connection to server failed"
- "ERROR: database 'sunnystack' already exists"
- "ERROR: role 'sunnystack' does not exist"

**Solutions:**

```bash
# 1. Ensure PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# 2. Check database exists
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U sunnystack -l

# 3. Drop database if stuck
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -c "DROP DATABASE IF EXISTS sunnystack WITH (FORCE);"

# 4. Recreate database
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -c "CREATE DATABASE sunnystack OWNER sunnystack;"
```

---

### Backup File Corrupted

**Symptoms:**

- "gzip: invalid compressed data"
- "psql: ERROR: syntax error at or near..."
- Backup file size is 0 bytes or unusually small

**Diagnosis:**

```bash
# Check file size
ls -lh /home/pi/backups/sunnystack_*.sql.gz

# Test decompression
gunzip -t /home/pi/backups/sunnystack_*.sql.gz

# Compare with cloud backup
rclone ls gdrive:backups/sunnystack/ | grep $(date +%Y%m%d)
```

**Solutions:**

```bash
# 1. Download backup from cloud (cloud backup may be valid)
rclone copy gdrive:backups/sunnystack/sunnystack_YYYYMMDD_HHMMSS.sql.gz ./

# 2. Use previous day's backup
ls -lh /home/pi/backups/ | tail -10

# 3. Run new manual backup
/home/pi/scripts/backup-database.sh
```

---

## Disaster Recovery Checklist

### Complete System Failure

**Scenario:** Raspberry Pi SD card corrupted, hardware failure, complete data loss

**Checklist:**

- [ ] **1. Setup New Pi** (or repair existing)
  - [ ] Install Raspberry Pi OS
  - [ ] Install Docker + Docker Compose
  - [ ] Clone repository: `git clone https://github.com/yourusername/sunny-stack.git`
  - [ ] Create `.env.production` file with credentials

- [ ] **2. Setup rclone**
  - [ ] Install rclone: `curl https://rclone.org/install.sh | sudo bash`
  - [ ] Configure Google Drive: `rclone config`
  - [ ] Test connection: `rclone lsf gdrive:`

- [ ] **3. Download Latest Backup**

  ```bash
  mkdir -p ~/backups
  LATEST=$(rclone lsf gdrive:backups/sunnystack/ | sort -r | head -1)
  rclone copy "gdrive:backups/sunnystack/$LATEST" ~/backups/
  gunzip ~/backups/*.sql.gz
  ```

- [ ] **4. Start PostgreSQL Container**

  ```bash
  cd ~/sunny-stack
  docker compose -f docker-compose.prod.yml up -d postgres
  sleep 10  # Wait for PostgreSQL to start
  ```

- [ ] **5. Create Database**

  ```bash
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U sunnystack -c "CREATE DATABASE sunnystack;"
  ```

- [ ] **6. Restore Backup**

  ```bash
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U sunnystack -d sunnystack < ~/backups/sunnystack_*.sql
  ```

- [ ] **7. Start Discord Bot**

  ```bash
  docker compose -f docker-compose.prod.yml up -d discord-bot
  docker compose -f docker-compose.prod.yml logs -f discord-bot
  ```

- [ ] **8. Verify System**
  - [ ] Check bot health: `curl http://localhost:8080/health`
  - [ ] Verify database: `docker compose -f docker-compose.prod.yml exec -T postgres psql -U sunnystack -c "SELECT COUNT(*) FROM quotes;"`
  - [ ] Test Discord commands
  - [ ] Setup cron job for future backups

- [ ] **9. Document Incident**
  - [ ] What failed?
  - [ ] How long was downtime?
  - [ ] What was restored?
  - [ ] Lessons learned

**Estimated Recovery Time:** 30-60 minutes

---

## Summary

**Key Takeaways:**

✅ **Automated backups** run daily at 2:00 AM
✅ **7-day local retention** on Pi (fast access)
✅ **30-day cloud retention** on Google Drive (disaster recovery)
✅ **Verify backups monthly** to ensure they work
✅ **Test restoration annually** in test environment
✅ **Monitor logs** for backup failures
✅ **Keep rclone configured** and tested

**Emergency Contacts:**

- **Backup Script:** `/home/pi/scripts/backup-database.sh`
- **Logs:** `/var/log/db-backup.log`
- **Cloud Backups:** `gdrive:backups/sunnystack/`
- **Local Backups:** `/home/pi/backups/`

**Remember:** The best backup is useless if you can't restore from it. Test regularly! 🔥

---

**Document Version:** 1.0.0
**Last Tested:** 2025-11-06
**Next Review:** 2025-12-06
