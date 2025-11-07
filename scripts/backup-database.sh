#!/bin/bash
#
# PostgreSQL Database Backup Script
#
# This script performs automated PostgreSQL backups for Sunny Stack:
# 1. Creates timestamped pg_dump backup
# 2. Compresses with gzip
# 3. Uploads to cloud storage (Google Drive via rclone)
# 4. Cleans up old backups (30-day retention)
# 5. Logs all operations
#
# Usage: ./backup-database.sh
# Cron: 0 2 * * * /home/pi/scripts/backup-database.sh
#

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# Configuration
# ============================================================================

# Timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_READABLE=$(date '+%Y-%m-%d %H:%M:%S')

# Backup directories
BACKUP_DIR="${BACKUP_DIR:-/home/pi/backups}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"  # Keep local backups for 7 days
CLOUD_RETENTION_DAYS="${CLOUD_RETENTION_DAYS:-30}" # Keep cloud backups for 30 days

# Database configuration
DB_NAME="${DB_NAME:-sunnystack}"
DB_USER="${DB_USER:-sunnystack}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup files
BACKUP_FILE="$BACKUP_DIR/sunnystack_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Logging
LOG_FILE="${LOG_FILE:-/var/log/db-backup.log}"
ERROR_LOG="${ERROR_LOG:-/var/log/db-backup-error.log}"

# Cloud storage (rclone remote name)
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RCLONE_PATH="${RCLONE_PATH:-backups/sunnystack}"

# Email notification (optional)
NOTIFY_EMAIL="${NOTIFY_EMAIL:-}"

# ============================================================================
# Functions
# ============================================================================

log() {
    echo "[$DATE_READABLE] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$DATE_READABLE] ERROR: $1" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG" >&2
}

send_notification() {
    local subject="$1"
    local message="$2"

    if [ -n "$NOTIFY_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$NOTIFY_EMAIL" 2>/dev/null || true
    fi
}

cleanup_exit() {
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        error "Backup failed with exit code $exit_code"
        send_notification "❌ Database Backup Failed" "Backup failed at $(date). Check logs: $LOG_FILE"
    fi

    exit $exit_code
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

trap cleanup_exit EXIT

log "=========================================="
log "Starting database backup"
log "=========================================="

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR" || {
        error "Failed to create backup directory: $BACKUP_DIR"
        exit 1
    }
fi

# Check disk space (require at least 1GB free)
AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 1 ]; then
    error "Insufficient disk space: ${AVAILABLE_SPACE}GB available (minimum 1GB required)"
    exit 1
fi
log "Disk space check: ${AVAILABLE_SPACE}GB available"

# Check if PostgreSQL is accessible
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    error "PostgreSQL is not accessible at $DB_HOST:$DB_PORT"
    exit 1
fi
log "PostgreSQL connection verified"

# Check if rclone is configured
if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:$"; then
    error "rclone remote '$RCLONE_REMOTE' not configured"
    error "Run: rclone config"
    exit 1
fi
log "rclone remote '$RCLONE_REMOTE' verified"

# ============================================================================
# Backup Database
# ============================================================================

log "Creating database dump: $BACKUP_FILE"

# Perform pg_dump with progress indicator
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --format=plain \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then

    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Database dump created successfully: $BACKUP_SIZE"
else
    error "pg_dump failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# ============================================================================
# Compress Backup
# ============================================================================

log "Compressing backup..."

if gzip -9 "$BACKUP_FILE"; then
    COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "✅ Backup compressed successfully: $COMPRESSED_SIZE"
else
    error "Compression failed"
    rm -f "$BACKUP_FILE" "$COMPRESSED_FILE"
    exit 1
fi

# ============================================================================
# Upload to Cloud Storage
# ============================================================================

log "Uploading to cloud storage: ${RCLONE_REMOTE}:${RCLONE_PATH}"

# Upload with progress and retry (3 attempts)
UPLOAD_SUCCESS=false
for attempt in 1 2 3; do
    log "Upload attempt $attempt/3..."

    if rclone copy "$COMPRESSED_FILE" "${RCLONE_REMOTE}:${RCLONE_PATH}" \
        --progress \
        --log-level INFO \
        --stats 10s \
        --transfers 1 \
        >> "$LOG_FILE" 2>&1; then

        log "✅ Backup uploaded to cloud storage"
        UPLOAD_SUCCESS=true
        break
    else
        error "Upload attempt $attempt failed"
        sleep 10
    fi
done

if [ "$UPLOAD_SUCCESS" = false ]; then
    error "All upload attempts failed - backup saved locally only"
    send_notification "⚠️  Database Backup Upload Failed" "Backup created but cloud upload failed. Local backup: $COMPRESSED_FILE"
    # Don't exit - local backup still exists
fi

# ============================================================================
# Verify Cloud Backup
# ============================================================================

if [ "$UPLOAD_SUCCESS" = true ]; then
    log "Verifying cloud backup..."

    REMOTE_FILE="${RCLONE_PATH}/$(basename "$COMPRESSED_FILE")"
    if rclone lsf "${RCLONE_REMOTE}:${REMOTE_FILE}" >/dev/null 2>&1; then
        REMOTE_SIZE=$(rclone size "${RCLONE_REMOTE}:${REMOTE_FILE}" --json | grep -o '"bytes":[0-9]*' | cut -d: -f2)
        LOCAL_SIZE=$(stat -c%s "$COMPRESSED_FILE" 2>/dev/null || stat -f%z "$COMPRESSED_FILE" 2>/dev/null)

        if [ "$REMOTE_SIZE" -eq "$LOCAL_SIZE" ]; then
            log "✅ Cloud backup verified (size matches: $COMPRESSED_SIZE)"
        else
            error "Cloud backup size mismatch (local: $LOCAL_SIZE, remote: $REMOTE_SIZE)"
        fi
    else
        error "Cloud backup verification failed - file not found"
    fi
fi

# ============================================================================
# Cleanup Old Backups
# ============================================================================

log "Cleaning up old backups..."

# Clean up old local backups (older than LOCAL_RETENTION_DAYS)
DELETED_LOCAL=$(find "$BACKUP_DIR" -name "sunnystack_*.sql.gz" -type f -mtime "+$LOCAL_RETENTION_DAYS" -delete -print | wc -l)
if [ "$DELETED_LOCAL" -gt 0 ]; then
    log "Deleted $DELETED_LOCAL old local backup(s) (older than $LOCAL_RETENTION_DAYS days)"
fi

# Clean up old cloud backups (older than CLOUD_RETENTION_DAYS)
if [ "$UPLOAD_SUCCESS" = true ]; then
    log "Cleaning up old cloud backups (older than $CLOUD_RETENTION_DAYS days)..."

    # Calculate cutoff date
    CUTOFF_DATE=$(date -d "$CLOUD_RETENTION_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${CLOUD_RETENTION_DAYS}d +%Y%m%d)

    # List and delete old backups
    rclone lsf "${RCLONE_REMOTE}:${RCLONE_PATH}" | while read -r file; do
        # Extract date from filename (format: sunnystack_YYYYMMDD_HHMMSS.sql.gz)
        FILE_DATE=$(echo "$file" | grep -oP 'sunnystack_\K\d{8}' || echo "")

        if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
            log "Deleting old cloud backup: $file (date: $FILE_DATE)"
            rclone delete "${RCLONE_REMOTE}:${RCLONE_PATH}/$file" >> "$LOG_FILE" 2>&1
        fi
    done
fi

# ============================================================================
# Summary
# ============================================================================

log "=========================================="
log "Backup Summary:"
log "  Database: $DB_NAME"
log "  Backup file: $(basename "$COMPRESSED_FILE")"
log "  Compressed size: $COMPRESSED_SIZE"
log "  Local path: $COMPRESSED_FILE"
log "  Cloud status: $([ "$UPLOAD_SUCCESS" = true ] && echo "✅ Uploaded" || echo "❌ Failed")"
log "  Retention: Local ${LOCAL_RETENTION_DAYS}d / Cloud ${CLOUD_RETENTION_DAYS}d"
log "=========================================="
log "✅ Backup completed successfully"
log ""

# Send success notification
send_notification "✅ Database Backup Successful" "Database backup completed at $(date). Size: $COMPRESSED_SIZE"

exit 0
