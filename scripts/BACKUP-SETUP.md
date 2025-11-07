# Database Backup Setup Guide

**Target:** Raspberry Pi Production Environment
**Script:** `scripts/backup-database.sh`
**Estimated Time:** 15-20 minutes

---

## Prerequisites

Before setting up automated backups, ensure:

- [ ] Raspberry Pi is running with PostgreSQL container
- [ ] Script file exists: `/home/pi/sunny-stack/scripts/backup-database.sh`
- [ ] Google Drive or S3 account for cloud storage
- [ ] SSH access to Raspberry Pi

---

## Step 1: Install rclone

rclone is required for uploading backups to cloud storage.

```bash
# SSH to Raspberry Pi
ssh pi@raspberry-pi.local

# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Verify installation
rclone --version
```

Expected output:

```
rclone v1.65.0
- os/version: debian 11 (64 bit)
- os/kernel: 6.1.21-v8+ (aarch64)
- os/type: linux
- os/arch: arm64 (ARMv8 compatible)
```

---

## Step 2: Configure rclone for Google Drive

```bash
# Start rclone configuration wizard
rclone config

# Follow these prompts:
```

**Wizard Prompts:**

```
1. n (New remote)
2. Name: gdrive
3. Storage: 18 (Google Drive)
4. Client ID: (press Enter to skip - use defaults)
5. Client Secret: (press Enter to skip - use defaults)
6. Scope: 1 (Full access)
7. Root folder: (press Enter to skip)
8. Service account: n (No)
9. Edit advanced config: n (No)
10. Use auto config: n (No - headless server)
```

**Authorization Steps:**

You'll see output like:

```
Please go to the following link: https://accounts.google.com/o/oauth2/auth?...
Enter verification code:
```

1. **Copy the URL** and open it in your browser
2. **Sign in** to your Google account
3. **Grant permissions** to rclone
4. **Copy the verification code** from the success page
5. **Paste the code** into the SSH terminal
6. Press **Enter**
7. Configure as team drive: **n** (No)
8. Confirm configuration: **y** (Yes)
9. Quit: **q**

**Test Connection:**

```bash
# List root directory (should show your Google Drive folders)
rclone lsf gdrive:

# Create backup directory
rclone mkdir gdrive:backups/sunnystack

# Test upload
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt gdrive:backups/sunnystack/
rm /tmp/test.txt

# Verify upload
rclone lsf gdrive:backups/sunnystack/
```

Expected output:

```
test.txt
```

---

## Step 3: Create Backup Directory

```bash
# Create local backup directory
sudo mkdir -p /home/pi/backups

# Set permissions
sudo chown pi:pi /home/pi/backups
sudo chmod 755 /home/pi/backups

# Create log directory
sudo touch /var/log/db-backup.log
sudo touch /var/log/db-backup-error.log
sudo touch /var/log/db-backup-cron.log

# Set permissions
sudo chown pi:pi /var/log/db-backup*.log
sudo chmod 644 /var/log/db-backup*.log
```

---

## Step 4: Copy Backup Script to Pi

```bash
# On your Windows development machine
# Navigate to project directory
cd "C:\Users\lukaf\Desktop\Dev Work\Sunny Stack"

# Copy script to Pi
scp scripts/backup-database.sh pi@raspberry-pi.local:~/scripts/

# Or use rsync
rsync -avz scripts/backup-database.sh pi@raspberry-pi.local:~/scripts/
```

---

## Step 5: Make Script Executable

```bash
# SSH to Pi
ssh pi@raspberry-pi.local

# Navigate to scripts directory
cd ~/sunny-stack/scripts

# Make script executable
chmod +x backup-database.sh

# Test script
./backup-database.sh
```

Expected output (abbreviated):

```
[2025-11-06 14:30:15] ==========================================
[2025-11-06 14:30:15] Starting database backup
[2025-11-06 14:30:16] Disk space check: 45GB available
[2025-11-06 14:30:16] PostgreSQL connection verified
[2025-11-06 14:30:16] rclone remote 'gdrive' verified
...
[2025-11-06 14:30:48] ✅ Backup completed successfully
```

---

## Step 6: Configure Cron Job

```bash
# Edit crontab
crontab -e

# Add this line at the end of the file:
0 2 * * * /home/pi/sunny-stack/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1

# Save and exit
# (Ctrl+X, then Y, then Enter if using nano)
```

**Explanation:**

- `0 2 * * *` - Run at 2:00 AM every day
- `/home/pi/sunny-stack/scripts/backup-database.sh` - Backup script path
- `>> /var/log/db-backup-cron.log` - Append output to log file
- `2>&1` - Redirect errors to same log file

**Verify Cron Job:**

```bash
# List all cron jobs
crontab -l

# Expected output:
0 2 * * * /home/pi/sunny-stack/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1
```

---

## Step 7: Test Cron Job (Optional but Recommended)

Instead of waiting until 2:00 AM, test the cron job now:

```bash
# Temporarily change cron to run in 2 minutes
crontab -e

# Change line to (replace HH:MM with 2 minutes from now):
MM HH * * * /home/pi/sunny-stack/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1

# Save and wait 2 minutes
# Watch cron log:
tail -f /var/log/db-backup-cron.log

# After backup runs successfully, change back to 2 AM:
crontab -e

# Change to:
0 2 * * * /home/pi/sunny-stack/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1
```

---

## Step 8: Configure Environment Variables (Optional)

Customize backup behavior with environment variables:

```bash
# Create environment file for backup script
sudo nano /etc/environment

# Add these variables:
BACKUP_DIR="/home/pi/backups"
LOCAL_RETENTION_DAYS="7"
CLOUD_RETENTION_DAYS="30"
RCLONE_REMOTE="gdrive"
RCLONE_PATH="backups/sunnystack"
DB_NAME="sunnystack"
DB_USER="sunnystack"
DB_HOST="localhost"
DB_PORT="5432"
LOG_FILE="/var/log/db-backup.log"
ERROR_LOG="/var/log/db-backup-error.log"

# Optional: Email notifications
NOTIFY_EMAIL="your-email@example.com"

# Save and exit (Ctrl+X, Y, Enter)

# Reload environment
source /etc/environment
```

---

## Step 9: Setup Email Notifications (Optional)

Get notified if backups fail:

```bash
# Install mailutils
sudo apt-get update
sudo apt-get install -y mailutils

# Configure email (use Gmail or other SMTP)
sudo nano /etc/ssmtp/ssmtp.conf

# Add:
root=your-email@gmail.com
mailhub=smtp.gmail.com:587
AuthUser=your-email@gmail.com
AuthPass=your-app-password
UseSTARTTLS=YES
UseTLS=YES

# Save and exit

# Test email
echo "Test email from Raspberry Pi" | mail -s "Test Subject" your-email@example.com

# Set NOTIFY_EMAIL environment variable (Step 8)
```

---

## Step 10: Verify Setup

Run through this checklist:

- [ ] rclone installed and configured
- [ ] rclone can list Google Drive files
- [ ] Backup directory created (`/home/pi/backups`)
- [ ] Log files created (`/var/log/db-backup*.log`)
- [ ] Backup script copied to Pi
- [ ] Script is executable (`chmod +x`)
- [ ] Manual script run succeeds
- [ ] Backup appears in local directory
- [ ] Backup uploaded to Google Drive
- [ ] Cron job configured (`crontab -l`)
- [ ] Cron job tested (or will run at 2 AM)
- [ ] Email notifications configured (optional)

---

## Monitoring

### Daily Checks

```bash
# Check if today's backup exists
ssh pi@raspberry-pi.local
ls -lh /home/pi/backups/sunnystack_$(date +%Y%m%d)*.sql.gz

# View last backup log
tail -20 /var/log/db-backup.log

# Check cloud backups
rclone lsf gdrive:backups/sunnystack/ | tail -5
```

### Weekly Checks

```bash
# Check disk space
df -h /home/pi/backups

# Check cloud storage usage
rclone size gdrive:backups/sunnystack/

# Review error logs
cat /var/log/db-backup-error.log
```

### Monthly Checks

- Test restore (see DATABASE-BACKUP-RESTORE.md)
- Verify retention policy (7 days local, 30 days cloud)
- Clean up old logs

---

## Troubleshooting

### Backup Script Fails

```bash
# Check script permissions
ls -l /home/pi/sunny-stack/scripts/backup-database.sh

# Should be: -rwxr-xr-x (executable)

# Check PostgreSQL is running
docker ps | grep postgres

# Check disk space
df -h /home/pi/backups

# Run script with verbose output
bash -x /home/pi/sunny-stack/scripts/backup-database.sh
```

### rclone Upload Fails

```bash
# Test rclone connection
rclone lsf gdrive:

# Reconfigure if needed
rclone config reconnect gdrive:

# Check network
ping -c 3 8.8.8.8

# Check Google Drive quota
rclone about gdrive:
```

### Cron Job Not Running

```bash
# Check cron service status
sudo systemctl status cron

# Restart cron
sudo systemctl restart cron

# Check cron log
tail -50 /var/log/db-backup-cron.log

# Check system log
sudo journalctl -u cron -n 50
```

---

## Uninstall / Disable

If you need to disable or remove the backup system:

```bash
# Disable cron job (comment out)
crontab -e
# Add # at start of backup line:
# 0 2 * * * /home/pi/sunny-stack/scripts/backup-database.sh >> /var/log/db-backup-cron.log 2>&1

# Or remove cron job entirely
crontab -r  # ⚠️ This removes ALL cron jobs for user

# Keep local backups but stop cloud uploads
# Edit script and comment out rclone upload section
```

---

## Summary

**What You've Configured:**

✅ **rclone** - Cloud storage integration (Google Drive)
✅ **Backup Script** - Automated PostgreSQL backup with compression
✅ **Cron Job** - Daily execution at 2:00 AM
✅ **Retention Policy** - 7 days local, 30 days cloud
✅ **Logging** - Success and error logs
✅ **Email Alerts** - Optional failure notifications

**Next Steps:**

1. Wait for 2:00 AM (or test with temporary cron time)
2. Verify backup appears in `/home/pi/backups/`
3. Verify backup uploaded to Google Drive
4. Review logs for success
5. Test restoration monthly (see DATABASE-BACKUP-RESTORE.md)

**Estimated Backup Size:**

- **Small database (<1000 rows):** ~500KB compressed
- **Medium database (1000-10000 rows):** ~1-5MB compressed
- **Large database (10000+ rows):** ~5-50MB compressed

**Storage Requirements:**

- **Local (7 days × 2MB):** ~15MB
- **Cloud (30 days × 2MB):** ~60MB

**You're all set!** 🎉

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-06
**Related Docs:**

- [DATABASE-BACKUP-RESTORE.md](../docs/deployment/DATABASE-BACKUP-RESTORE.md) - Backup & restoration procedures
- [backup-database.sh](./backup-database.sh) - Backup script
