# 🤖 Sunny Stack Assistant - Command Reference

## 📋 Project Commands

`/project-create <title> <client-name> <client-email> <description>` - Create a new project
`/project-list [status] [page]` - List all projects with filtering
`/project-status <title>` - Get detailed project status
`/project-update <project-title> [fields...]` - Update project details
`/project-delete <project-title> <confirm>` - Delete a project (soft delete)

---

## 💬 Quote Commands

`/quote-list [status] [page]` - List all quote requests
`/quote-review <email|company>` - Review a specific quote request
`/quote-convert <email|company> [budget] [deadline]` - Convert quote to project
`/quote-approve <action> <email|company>` - Approve or decline a quote

---

## ⏱️ Time Tracking

`/time-start <project-title> [description]` - Start time tracking
`/time-stop` - Stop active time tracking
`/time-log <project-title> <duration> [description] [started-at]` - Manually log time
`/time-report [project-title] [period]` - Generate time reports

---

## 🔍 Monitoring

`/monitor-status` - Check overall system health
`/monitor-services` - View all monitored services
`/monitor-alerts [page]` - View recent alerts

---

## ⚙️ Admin

`/admin-sync` - Sync commands with Discord
`/admin-health` - Check bot health and API connectivity

---

💡 **Tip:** Type `/` in this channel to see all available commands
⚠️ **Alerts:** Critical alerts will ping you in #admin-logs
