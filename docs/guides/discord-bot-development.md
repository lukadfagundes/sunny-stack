# Discord Bot Development Guide

Complete guide for developing, testing, and deploying Discord bot features for Sunny Stack Portfolio.

---

## Bot Architecture Overview

### Technology Stack

- **Framework:** Discord.js 14.14.1
- **Language:** TypeScript 5.5
- **Runtime:** Node.js 22.x
- **Deployment:** Raspberry Pi (Docker container)
- **API Integration:** Vercel Next.js API (REST)

### Architecture Diagram

```
┌──────────────────────────────────────────────────┐
│            Discord Platform                       │
│  (Gateway API - WebSocket)                        │
└────────────────────┬─────────────────────────────┘
                     │ Persistent WebSocket
                     ↓
┌──────────────────────────────────────────────────┐
│       Discord.js Client (Raspberry Pi)           │
│  ┌────────────────────────────────────────────┐  │
│  │ Event Handlers (interactionCreate, ready)  │  │
│  └──────────────────┬─────────────────────────┘  │
│                     ↓                             │
│  ┌────────────────────────────────────────────┐  │
│  │ Command Registry (21 slash commands)      │  │
│  └──────────────────┬─────────────────────────┘  │
│                     ↓                             │
│  ┌────────────────────────────────────────────┐  │
│  │ API Client (HTTP to Vercel)               │  │
│  └──────────────────┬─────────────────────────┘  │
└─────────────────────┼──────────────────────────┘
                      │ HTTPS
                      ↓
┌──────────────────────────────────────────────────┐
│         Vercel Next.js API Routes               │
│         (Serverless Functions)                   │
└──────────────────┬───────────────────────────────┘
                   │ DATABASE_URL
                   ↓
┌──────────────────────────────────────────────────┐
│      PostgreSQL Database (Raspberry Pi)          │
└──────────────────────────────────────────────────┘
```

### Why Separate Bot Build?

**Problem:** Vercel serverless functions have 10-second timeout
**Solution:** Bot runs 24/7 on Raspberry Pi with persistent WebSocket connection

- **Discord.js requires:** Persistent connection to Gateway API
- **Vercel limitation:** No long-running processes, 10s timeout
- **Solution:** Dual deployment architecture (bot on Pi, API on Vercel)

---

## Project Structure

### Bot Directory Layout

```
bot/
├── commands/              # Slash command implementations
│   ├── admin/            # Admin-only commands
│   │   ├── deploy.ts     # Deploy slash commands
│   │   ├── health.ts     # Health check command
│   │   └── logs.ts       # View bot logs
│   ├── general/          # General commands
│   │   ├── help.ts       # Help command
│   │   └── ping.ts       # Ping/pong test
│   ├── investigation/    # Investigation commands
│   │   └── index.ts      # Code investigation commands
│   ├── monitoring/       # Monitoring commands
│   │   ├── alerts.ts     # View/manage alerts
│   │   ├── github.ts     # GitHub API status
│   │   └── services.ts   # Service health checks
│   ├── project/          # Project management
│   │   ├── create.ts     # Create project
│   │   ├── delete.ts     # Delete project
│   │   ├── list.ts       # List projects
│   │   ├── status.ts     # Project status
│   │   └── update.ts     # Update project
│   ├── quote/            # Quote management
│   │   └── list.ts       # List quotes
│   ├── time/             # Time tracking
│   │   ├── log.ts        # Log time entry
│   │   ├── report.ts     # Time report
│   │   ├── start.ts      # Start timer
│   │   └── stop.ts       # Stop timer
│   ├── base-command.ts   # Abstract base class
│   ├── deploy.ts         # Command deployment utility
│   └── registry.ts       # Command registration
├── core/                 # Core bot functionality
│   ├── api-client.ts     # Vercel API HTTP client
│   ├── errors.ts         # Custom error classes
│   └── logger.ts         # Winston logger wrapper
├── events/               # Discord event handlers
│   ├── interactionCreate.ts  # Slash command handling
│   ├── ready.ts              # Bot startup
│   └── error.ts              # Error handling
├── gateway/              # Gateway connection management
│   └── client.ts         # Discord.js client setup
├── interactions/         # Interaction handling (webhooks)
│   └── verify.ts         # Signature verification
├── notifications/        # Discord notification senders
│   ├── project.ts        # Project notifications
│   ├── quote.ts          # Quote notifications
│   └── monitoring.ts     # Monitoring alerts
├── utils/                # Utility functions
│   ├── circuit-breaker.ts  # Circuit breaker pattern
│   ├── rate-limiter.ts     # Rate limiting
│   └── retry.ts            # Retry with backoff
├── config.ts             # Environment configuration
├── health-server.ts      # Health check HTTP server
├── index.ts              # Main entry point
└── types.ts              # TypeScript type definitions
```

---

## Discord.js 14 Command Pattern

### Base Command Class

All commands extend `BaseCommand`:

```typescript
// bot/commands/base-command.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

export abstract class BaseCommand {
  // Command definition (SlashCommandBuilder)
  abstract data: SlashCommandBuilder;

  // Command execution logic
  abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

  // Optional: Required permissions
  permissions?: PermissionFlagsBits[];

  /**
   * Check if user is admin
   */
  protected async requireAdmin(
    interaction: ChatInputCommandInteraction,
  ): Promise<boolean> {
    const config = loadBotConfig();

    if (interaction.user.id !== config.adminUserId) {
      await interaction.reply({
        content: "❌ This command requires admin permissions.",
        ephemeral: true,
      });
      return false;
    }

    return true;
  }

  /**
   * Handle command errors gracefully
   */
  protected async handleError(
    interaction: ChatInputCommandInteraction,
    error: Error,
  ): Promise<void> {
    botLogger.error("Command execution failed", {
      command: interaction.commandName,
      userId: interaction.user.id,
      error: error.message,
      stack: error.stack,
    });

    const errorMessage = {
      content: "❌ An error occurred while executing this command.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}
```

---

## Creating New Commands

### Step 1: Create Command File

**Example:** Create `/project-summary` command

```typescript
// bot/commands/project/summary.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { BaseCommand } from "../base-command";
import { ApiClient } from "../../core/api-client";
import { botLogger } from "../../core/logger";

export class ProjectSummaryCommand extends BaseCommand {
  // Define command structure
  data = new SlashCommandBuilder()
    .setName("project-summary")
    .setDescription("Get summary of a project")
    .addStringOption(
      (option) =>
        option
          .setName("project-id")
          .setDescription("Project ID or title")
          .setRequired(true)
          .setAutocomplete(true), // Enable autocomplete
    )
    .addBooleanOption((option) =>
      option
        .setName("include-time")
        .setDescription("Include time tracking summary")
        .setRequired(false),
    );

  // Execute command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // ALWAYS defer reply first for operations > 3 seconds
      // Discord requires response within 3 seconds
      await interaction.deferReply();

      // Get command options
      const projectId = interaction.options.getString("project-id", true);
      const includeTime =
        interaction.options.getBoolean("include-time") ?? false;

      // Call Vercel API
      const apiClient = new ApiClient();
      const project = await apiClient.getProject(projectId);

      if (!project) {
        await interaction.editReply({
          content: `❌ Project not found: ${projectId}`,
        });
        return;
      }

      // Build response embed
      const embed = new EmbedBuilder()
        .setColor(this.getStatusColor(project.status))
        .setTitle(`📊 ${project.title}`)
        .setDescription(project.description || "No description")
        .addFields(
          { name: "Client", value: project.clientName, inline: true },
          { name: "Status", value: project.status, inline: true },
          { name: "Budget", value: `$${project.budget || 0}`, inline: true },
          {
            name: "Deadline",
            value: project.deadline || "Not set",
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({ text: `Project ID: ${project.id}` });

      // Add time tracking if requested
      if (includeTime) {
        const timeEntries = await apiClient.getTimeEntries(projectId);
        const totalMinutes = timeEntries.reduce(
          (sum, entry) => sum + (entry.durationMinutes || 0),
          0,
        );
        const totalHours = (totalMinutes / 60).toFixed(2);

        embed.addFields({
          name: "⏱️ Time Tracked",
          value: `${totalHours} hours (${timeEntries.length} entries)`,
          inline: false,
        });
      }

      // Send response
      await interaction.editReply({ embeds: [embed] });

      // Log success
      botLogger.info("Project summary command executed", {
        projectId,
        userId: interaction.user.id,
        includeTime,
      });
    } catch (error) {
      await this.handleError(interaction, error as Error);
    }
  }

  /**
   * Get color based on project status
   */
  private getStatusColor(status: string): number {
    const colors: Record<string, number> = {
      PLANNING: 0x3498db, // Blue
      IN_PROGRESS: 0xf39c12, // Orange
      REVIEW: 0x9b59b6, // Purple
      COMPLETE: 0x2ecc71, // Green
      ARCHIVED: 0x95a5a6, // Gray
    };

    return colors[status] || 0x95a5a6;
  }
}
```

### Step 2: Register Command

```typescript
// bot/commands/registry.ts
import { ProjectSummaryCommand } from "./project/summary";

// Create registry instance
export const commandRegistry = new CommandRegistry();

// Register all commands
commandRegistry.register(new ProjectSummaryCommand());
// ... other commands
```

### Step 3: Deploy Command to Discord

```bash
# From project root
npm run bot:deploy

# Or manually
cd ~/projects/sunny-stack
node bot/commands/deploy.js
```

**Expected output:**

```
Started refreshing application (/) commands.
Successfully reloaded application (/) commands.
Deployed 22 commands
```

### Step 4: Test Command

**In Discord:**

1. Type `/project-summary` in any channel
2. Command should appear in autocomplete
3. Fill in required parameters
4. Press Enter
5. Bot should respond with project summary

---

## Command Development Patterns

### Pattern 1: Simple Command (No API calls)

**Example:** `/ping` command

```typescript
export class PingCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot response time");

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(`🏓 Pong! Latency: ${latency}ms`);
  }
}
```

### Pattern 2: API Integration Command

**Example:** `/project-list` command

```typescript
export class ProjectListCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName("project-list")
    .setDescription("List all projects")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Filter by status")
        .setRequired(false)
        .addChoices(
          { name: "Active", value: "IN_PROGRESS" },
          { name: "Planning", value: "PLANNING" },
          { name: "Complete", value: "COMPLETE" },
        ),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const status = interaction.options.getString("status");

    const apiClient = new ApiClient();
    const projects = await apiClient.getProjects(status || undefined);

    if (projects.length === 0) {
      await interaction.editReply({
        content: "📋 No projects found.",
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("📊 Projects")
      .setDescription(`Found ${projects.length} projects`)
      .setTimestamp();

    // Add fields (max 25 fields in embed)
    projects.slice(0, 25).forEach((project) => {
      embed.addFields({
        name: `${project.title} (${project.status})`,
        value: `Client: ${project.clientName} | Budget: $${project.budget || 0}`,
        inline: false,
      });
    });

    if (projects.length > 25) {
      embed.setFooter({
        text: `Showing 25 of ${projects.length} projects`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
```

### Pattern 3: Admin-Only Command

**Example:** `/logs` command

```typescript
export class LogsCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName("logs")
    .setDescription("View recent bot logs (Admin only)")
    .addIntegerOption((option) =>
      option
        .setName("lines")
        .setDescription("Number of lines to show")
        .setMinValue(10)
        .setMaxValue(100),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Check admin permission
    if (!(await this.requireAdmin(interaction))) {
      return; // Error message already sent by requireAdmin
    }

    await interaction.deferReply({ ephemeral: true }); // Private response

    const lines = interaction.options.getInteger("lines") || 50;

    // Read log file
    const logs = await this.getRecentLogs(lines);

    await interaction.editReply({
      content: `\`\`\`\n${logs}\n\`\`\``,
    });
  }

  private async getRecentLogs(lines: number): Promise<string> {
    // Implementation: Read from log file or Winston transport
    // Return last N lines
    return "...";
  }
}
```

### Pattern 4: Modal Input Command

**Example:** `/quote-create` with modal form

```typescript
export class QuoteCreateCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName("quote-create")
    .setDescription("Create a new quote request");

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId("quote-create-modal")
      .setTitle("Create Quote Request");

    // Add text inputs
    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Client Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Project Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    // Add inputs to modal
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    );

    // Show modal
    await interaction.showModal(modal);

    // Handle modal submission in separate event handler
  }
}

// In events/interactionCreate.ts:
if (
  interaction.isModalSubmit() &&
  interaction.customId === "quote-create-modal"
) {
  const name = interaction.fields.getTextInputValue("name");
  const description = interaction.fields.getTextInputValue("description");

  // Create quote via API
  const apiClient = new ApiClient();
  const quote = await apiClient.createQuote({ name, description });

  await interaction.reply({
    content: `✅ Quote created: ${quote.id}`,
    ephemeral: true,
  });
}
```

---

## Event Handlers

### Available Discord Events

```typescript
// bot/events/ready.ts
import { Client, Events } from "discord.js";
import { botLogger } from "../core/logger";

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (c) => {
    botLogger.info("Bot ready", {
      username: c.user.tag,
      guilds: c.guilds.cache.size,
      commands: commandRegistry.size(),
    });

    // Set bot status
    c.user.setPresence({
      activities: [{ name: "Managing projects", type: ActivityType.Watching }],
      status: "online",
    });
  });
}
```

```typescript
// bot/events/interactionCreate.ts
import { Client, Events, Interaction } from "discord.js";
import { commandRegistry } from "../commands/registry";
import { botLogger } from "../core/logger";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = commandRegistry.get(interaction.commandName);

      if (!command) {
        botLogger.warn("Unknown command", {
          command: interaction.commandName,
        });
        await interaction.reply({
          content: "❌ Unknown command",
          ephemeral: true,
        });
        return;
      }

      try {
        const startTime = Date.now();
        await command.execute(interaction);
        const executionTime = Date.now() - startTime;

        botLogger.info("Command executed successfully", {
          command: interaction.commandName,
          userId: interaction.user.id,
          executionTime,
        });
      } catch (error) {
        botLogger.error("Command execution failed", {
          command: interaction.commandName,
          error,
        });

        const errorMessage = {
          content: "❌ An error occurred while executing this command.",
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      // Handle autocomplete logic (see below)
    }
  });
}
```

### Autocomplete Pattern

```typescript
// In interactionCreate event handler
if (interaction.isAutocomplete()) {
  const command = commandRegistry.get(interaction.commandName);

  if (command && "autocomplete" in command) {
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      botLogger.error("Autocomplete failed", { error });
    }
  }
}

// In command class
export class ProjectSummaryCommand extends BaseCommand {
  // ... data and execute ...

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedValue = interaction.options.getFocused();

    // Fetch projects from API
    const apiClient = new ApiClient();
    const projects = await apiClient.searchProjects(focusedValue);

    // Return max 25 choices
    const choices = projects.slice(0, 25).map((project) => ({
      name: `${project.title} (${project.status})`,
      value: project.id,
    }));

    await interaction.respond(choices);
  }
}
```

---

## API Integration

### API Client Pattern

```typescript
// bot/core/api-client.ts
import { loadBotConfig } from "../config";
import { botLogger } from "./logger";
import { retryWithBackoff } from "../utils/retry";

export class ApiClient {
  private baseUrl: string;
  private apiSecret: string;

  constructor() {
    const config = loadBotConfig();
    this.baseUrl = config.apiUrl;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Generic request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    botLogger.debug("API request", {
      method: options.method || "GET",
      url,
    });

    // Use retry logic with exponential backoff
    return retryWithBackoff(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiSecret}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        botLogger.error("API request failed", {
          url,
          status: response.status,
          error,
        });
        throw new Error(`API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      botLogger.debug("API response received", {
        url,
        status: response.status,
      });

      return data;
    });
  }

  // Project endpoints
  async getProject(projectId: string) {
    return this.request<Project>(`/api/admin/projects/${projectId}`);
  }

  async getProjects(status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.request<Project[]>(`/api/admin/projects${query}`);
  }

  async createProject(data: CreateProjectData) {
    return this.request<Project>("/api/admin/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(projectId: string, data: UpdateProjectData) {
    return this.request<Project>(`/api/admin/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string) {
    return this.request<void>(`/api/admin/projects/${projectId}`, {
      method: "DELETE",
    });
  }

  // Time tracking endpoints
  async getTimeEntries(projectId: string) {
    return this.request<TimeEntry[]>(
      `/api/admin/time-entries?projectId=${projectId}`,
    );
  }

  async logTime(data: LogTimeData) {
    return this.request<TimeEntry>("/api/admin/time-entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
```

---

## Testing Bot Commands

### Local Testing Setup

```bash
# 1. Set up environment variables
cp .env.example .env.local

# Add Discord bot credentials:
DISCORD_BOT_TOKEN=your_token
DISCORD_APPLICATION_ID=your_app_id
DISCORD_GUILD_ID=your_test_guild_id
DISCORD_ADMIN_USER_ID=your_user_id
BOT_API_URL=http://localhost:3000
BOT_API_SECRET=test_secret

# 2. Start local Next.js server
npm run dev

# 3. In another terminal, start bot
npm run bot:dev

# 4. Deploy commands to test server
npm run bot:deploy
```

### Test Command Execution

**In Discord test server:**

1. Type `/` to see all commands
2. Select command to test
3. Fill in parameters
4. Check bot response
5. Monitor console logs for errors

### Unit Testing Commands

```typescript
// __tests__/unit/bot/commands/ping.test.ts
import { PingCommand } from "@/bot/commands/general/ping";
import { mockInteraction } from "@/test/mocks/discord";

describe("PingCommand", () => {
  let command: PingCommand;

  beforeEach(() => {
    command = new PingCommand();
  });

  it("responds with pong message", async () => {
    const interaction = mockInteraction({
      commandName: "ping",
    });

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Pong"),
      }),
    );
  });

  it("calculates latency correctly", async () => {
    const interaction = mockInteraction();

    await command.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining("ms"),
    );
  });
});
```

---

## Deployment Procedures

### Deploy to Raspberry Pi

See [PI-DEPLOYMENT.md](../deployment/PI-DEPLOYMENT.md) for complete procedures.

**Quick Reference:**

```bash
# SSH to Pi
ssh pi@raspberrypi.local

# Navigate to project
cd ~/projects/sunny-stack

# Pull latest code
git pull origin main

# Rebuild bot image
docker compose stop discord-bot
docker build -t sunny-stack-bot:latest -f Dockerfile .
docker compose up -d discord-bot

# Deploy slash commands (if new commands added)
docker compose exec discord-bot npm run bot:deploy

# Verify bot is online
docker compose logs -f discord-bot
```

---

## Best Practices

### 1. Always Defer Long Operations

```typescript
// ❌ Bad: Operation might timeout
async execute(interaction) {
  const data = await longAPICall();  // Takes 5 seconds
  await interaction.reply({ content: data });  // Too late!
}

// ✅ Good: Defer immediately
async execute(interaction) {
  await interaction.deferReply();  // Acknowledge within 3 seconds
  const data = await longAPICall();  // Can take longer now
  await interaction.editReply({ content: data });
}
```

### 2. Use Ephemeral Responses for Errors and Admin Commands

```typescript
// Private error message
await interaction.reply({
  content: "❌ Error message",
  ephemeral: true, // Only visible to command user
});
```

### 3. Implement Error Handling

```typescript
async execute(interaction) {
  try {
    await interaction.deferReply();
    // Command logic...
  } catch (error) {
    await this.handleError(interaction, error as Error);
  }
}
```

### 4. Log All Command Executions

```typescript
botLogger.info("Command executed", {
  command: interaction.commandName,
  userId: interaction.user.id,
  executionTime,
  success: true,
});
```

### 5. Validate Inputs

```typescript
const projectId = interaction.options.getString("project-id", true);

if (!projectId || projectId.length < 5) {
  await interaction.reply({
    content: "❌ Invalid project ID",
    ephemeral: true,
  });
  return;
}
```

### 6. Use Embeds for Rich Responses

```typescript
const embed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle("Success")
  .setDescription("Operation completed")
  .addFields(
    { name: "Field 1", value: "Value 1", inline: true },
    { name: "Field 2", value: "Value 2", inline: true },
  )
  .setTimestamp()
  .setFooter({ text: "Sunny Stack Bot" });

await interaction.editReply({ embeds: [embed] });
```

---

## Common Issues

### Issue: Command Not Appearing in Discord

**Fix:** Deploy commands to Discord API

```bash
npm run bot:deploy
```

### Issue: "Unknown Interaction" Error

**Cause:** Command took longer than 3 seconds to respond

**Fix:** Defer reply immediately

```typescript
await interaction.deferReply();
```

### Issue: Bot Goes Offline Randomly

**Cause:** WebSocket disconnection, memory leak, or crash

**Fix:** Check logs and implement reconnection logic (already in gateway/client.ts)

For more troubleshooting, see [TROUBLESHOOTING.md](../deployment/TROUBLESHOOTING.md).

---

## Related Documentation

- **[Bot CLAUDE.md](../../bot/CLAUDE.md)** - Bot-specific development rules
- **[Pi Deployment](../deployment/PI-DEPLOYMENT.md)** - Bot deployment procedures
- **[Troubleshooting](../deployment/TROUBLESHOOTING.md)** - Bot troubleshooting

---

**Last Updated:** 2026-01-07
**Discord.js Version:** 14.14.1
**Bot Commands:** 21 (as of 2026-01-07)
**Maintained by:** Sunny Stack Development Team
