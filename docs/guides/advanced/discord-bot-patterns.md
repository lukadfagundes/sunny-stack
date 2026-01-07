# Advanced Discord Bot Patterns

This guide covers advanced Discord.js patterns used in sunny-stack's Discord bot, including event-driven architecture, command middleware, interactive components, and advanced permission handling.

## Table of Contents

- [Event-Driven Architecture](#event-driven-architecture)
- [Command Middleware](#command-middleware)
- [Context Menus](#context-menus)
- [Message Components](#message-components)
- [Modals and Forms](#modals-and-forms)
- [Embed Pagination](#embed-pagination)
- [Advanced Permission Checks](#advanced-permission-checks)

---

## Event-Driven Architecture

### Understanding Discord Events

The Discord bot operates on an event-driven model where the bot responds to events from Discord Gateway (WebSocket connection).

### Pattern: Event Handler Structure

```ts
// bot/events/ready.ts
import type { Client } from "discord.js";
import { botLogger } from "../core/logger";

export default {
  name: "ready",
  once: true, // Only fire once on startup
  async execute(client: Client) {
    botLogger.info(`Bot logged in as ${client.user?.tag}`);
    botLogger.info(`Serving ${client.guilds.cache.size} guilds`);

    // Set bot presence
    client.user?.setPresence({
      activities: [{ name: "sunny-stack.com", type: 0 }],
      status: "online",
    });
  },
};
```

```ts
// bot/events/interactionCreate.ts
import type { Interaction } from "discord.js";
import { botLogger } from "../core/logger";
import { getCommand } from "../commands/registry";

export default {
  name: "interactionCreate",
  async execute(interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = getCommand(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: "Unknown command",
          ephemeral: true,
        });
        return;
      }

      try {
        // Defer reply immediately (commands have 3 seconds to respond)
        await interaction.deferReply({
          ephemeral: command.permissions ? true : false,
        });

        // Execute command with validation
        await command.executeWithValidation(interaction, getBotConfig());
      } catch (error) {
        botLogger.error("Command execution error", { error });
        await interaction.followUp({
          content: "An error occurred executing the command",
          ephemeral: true,
        });
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      // Handle button click (see Message Components section)
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      // Handle select menu (see Message Components section)
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      // Handle modal submission (see Modals section)
    }
  },
};
```

### Pattern: Event Loader

```ts
// bot/core/event-loader.ts
import type { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { botLogger } from "./logger";

export async function loadEvents(client: Client) {
  const eventsPath = join(__dirname, "../events");
  const eventFiles = readdirSync(eventsPath).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js"),
  );

  for (const file of eventFiles) {
    const event = (await import(join(eventsPath, file))).default;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    botLogger.info(`Event loaded: ${event.name}`);
  }
}
```

### Pattern: Custom Event Emitters

```ts
// bot/core/custom-events.ts
import { EventEmitter } from "events";

export class BotEventEmitter extends EventEmitter {
  // Type-safe event emitter
  emitProjectCreated(projectId: string) {
    this.emit("project:created", projectId);
  }

  emitTimeEntryLogged(timeEntry: any) {
    this.emit("timeEntry:logged", timeEntry);
  }

  emitQuoteReceived(quote: any) {
    this.emit("quote:received", quote);
  }
}

export const botEvents = new BotEventEmitter();
```

```ts
// Usage in command
import { botEvents } from "../core/custom-events";

botEvents.emitProjectCreated(project.id);

// Listen in event handler
botEvents.on("project:created", async (projectId) => {
  // Send notification to Discord channel
  const channel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
  if (channel?.isTextBased()) {
    await channel.send(`New project created: ${projectId}`);
  }
});
```

---

## Command Middleware

### Pattern: Base Command Class

```ts
// bot/commands/base-command.ts (already exists in codebase)
import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import type { Command, PermissionLevel, BotConfig } from "../types";
import { validatePermission } from "../utils/permissions";
import { checkRateLimit } from "../utils/rate-limiter";
import { logCommandExecution, botLogger } from "../core/logger";
import {
  PermissionError,
  RateLimitError,
  ValidationError,
} from "../core/errors";

export abstract class BaseCommand implements Command {
  abstract data: SlashCommandBuilder;
  abstract permissions?: PermissionLevel;

  // Validation wrapper with middleware chain
  async executeWithValidation(
    interaction: ChatInputCommandInteraction,
    config: BotConfig,
  ): Promise<void> {
    const startTime = Date.now();
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    try {
      // 1. Permission validation
      if (this.permissions) {
        const hasPermission = validatePermission(
          userId,
          this.permissions,
          config,
        );
        if (!hasPermission) {
          throw new PermissionError("Access denied", userId, this.permissions);
        }
      }

      // 2. Rate limit check
      const rateLimitResult = checkRateLimit(userId);
      if (!rateLimitResult.allowed) {
        throw new RateLimitError(
          "Rate limit exceeded",
          rateLimitResult.retryAfter,
        );
      }

      // 3. Execute command
      await this.run(interaction);

      // 4. Log success
      logCommandExecution({
        command: commandName,
        userId,
        success: true,
        executionTime: Date.now() - startTime,
      });
    } catch (error) {
      this.handleError(interaction, error, Date.now() - startTime);
    }
  }

  abstract run(interaction: ChatInputCommandInteraction): Promise<void>;

  private handleError(
    interaction: ChatInputCommandInteraction,
    error: unknown,
    executionTime: number,
  ) {
    // Error handling logic (see base-command.ts in codebase)
  }
}
```

### Pattern: Custom Middleware Decorators

```ts
// bot/decorators/middleware.ts
export function RequireGuild() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      interaction: ChatInputCommandInteraction,
    ) {
      if (!interaction.guild) {
        await interaction.followUp({
          content: "❌ This command can only be used in a server",
          ephemeral: true,
        });
        return;
      }

      return originalMethod.call(this, interaction);
    };

    return descriptor;
  };
}

export function RequireChannel(channelId: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      interaction: ChatInputCommandInteraction,
    ) {
      if (interaction.channelId !== channelId) {
        await interaction.followUp({
          content: "❌ This command can only be used in a specific channel",
          ephemeral: true,
        });
        return;
      }

      return originalMethod.call(this, interaction);
    };

    return descriptor;
  };
}
```

```ts
// Usage
import { BaseCommand } from "./base-command";
import { RequireGuild, RequireChannel } from "../decorators/middleware";

export class AdminCommand extends BaseCommand {
  // ... command setup

  @RequireGuild()
  @RequireChannel("1234567890")
  async run(interaction: ChatInputCommandInteraction) {
    // Only runs in guild and specific channel
  }
}
```

---

## Context Menus

### Understanding Context Menus

Context menus appear when right-clicking on a user or message. They're useful for actions on specific targets.

### Pattern: User Context Menu

```ts
// bot/commands/context/user-info.ts
import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ContextMenuCommandInteraction,
} from "discord.js";
import { EmbedBuilder } from "discord.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("User Info")
    .setType(ApplicationCommandType.User),

  async execute(interaction: ContextMenuCommandInteraction) {
    if (!interaction.isUserContextMenuCommand()) return;

    const targetUser = interaction.targetUser;
    const member = interaction.guild?.members.cache.get(targetUser.id);

    const embed = new EmbedBuilder()
      .setTitle(`User Info: ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: "ID", value: targetUser.id, inline: true },
        {
          name: "Created",
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: "Bot", value: targetUser.bot ? "Yes" : "No", inline: true },
      );

    if (member) {
      embed.addFields(
        {
          name: "Joined",
          value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`,
          inline: true,
        },
        {
          name: "Roles",
          value: member.roles.cache.map((r) => r.name).join(", ") || "None",
          inline: false,
        },
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
```

### Pattern: Message Context Menu

```ts
// bot/commands/context/save-message.ts
import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ContextMenuCommandInteraction,
} from "discord.js";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Save Message")
    .setType(ApplicationCommandType.Message),

  async execute(interaction: ContextMenuCommandInteraction) {
    if (!interaction.isMessageContextMenuCommand()) return;

    const targetMessage = interaction.targetMessage;

    // Save to database or send to user DM
    try {
      await interaction.user.send({
        content: `Saved message from ${targetMessage.author.tag} in ${interaction.guild?.name}:`,
        embeds:
          targetMessage.embeds.length > 0 ? [targetMessage.embeds[0]] : [],
        content: targetMessage.content || "*[No content]*",
      });

      await interaction.reply({
        content: "✅ Message saved to your DMs",
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: "❌ Failed to send DM. Make sure your DMs are open.",
        ephemeral: true,
      });
    }
  },
};
```

---

## Message Components

### Pattern: Button Interactions

```ts
// bot/commands/confirm-delete.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("delete-project")
    .setDescription("Delete a project")
    .addStringOption((option) =>
      option
        .setName("project-id")
        .setDescription("Project ID to delete")
        .setRequired(true),
    ),

  async run(interaction: ChatInputCommandInteraction) {
    const projectId = interaction.options.getString("project-id", true);

    // Create confirmation buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm-delete:${projectId}`)
        .setLabel("Confirm Delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancel-delete:${projectId}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.followUp({
      content: `⚠️ Are you sure you want to delete project \`${projectId}\`?`,
      components: [row],
      ephemeral: true,
    });
  },
};
```

```ts
// bot/events/interactionCreate.ts (button handler)
if (interaction.isButton()) {
  const [action, projectId] = interaction.customId.split(":");

  if (action === "confirm-delete") {
    // Delete project
    await deleteProject(projectId);

    await interaction.update({
      content: `✅ Project \`${projectId}\` deleted`,
      components: [], // Remove buttons
    });
  } else if (action === "cancel-delete") {
    await interaction.update({
      content: "❌ Deletion cancelled",
      components: [],
    });
  }
}
```

### Pattern: Select Menu

```ts
// bot/commands/select-project-status.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("update-status")
    .setDescription("Update project status")
    .addStringOption((option) =>
      option
        .setName("project-id")
        .setDescription("Project ID")
        .setRequired(true),
    ),

  async run(interaction: ChatInputCommandInteraction) {
    const projectId = interaction.options.getString("project-id", true);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`status-select:${projectId}`)
      .setPlaceholder("Select new status")
      .addOptions([
        { label: "Planning", value: "PLANNING", emoji: "📋" },
        { label: "In Progress", value: "IN_PROGRESS", emoji: "🚀" },
        { label: "Completed", value: "COMPLETED", emoji: "✅" },
        { label: "On Hold", value: "ON_HOLD", emoji: "⏸️" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu,
    );

    await interaction.followUp({
      content: "Select new project status:",
      components: [row],
      ephemeral: true,
    });
  },
};
```

```ts
// bot/events/interactionCreate.ts (select menu handler)
if (interaction.isStringSelectMenu()) {
  const [action, projectId] = interaction.customId.split(":");

  if (action === "status-select") {
    const newStatus = interaction.values[0];

    // Update project status
    await updateProjectStatus(projectId, newStatus);

    await interaction.update({
      content: `✅ Project status updated to **${newStatus}**`,
      components: [],
    });
  }
}
```

---

## Modals and Forms

### Pattern: Modal Form

```ts
// bot/commands/create-project-modal.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("create-project")
    .setDescription("Create a new project"),

  async run(interaction: ChatInputCommandInteraction) {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId("create-project-modal")
      .setTitle("Create New Project");

    // Add text inputs
    const titleInput = new TextInputBuilder()
      .setCustomId("project-title")
      .setLabel("Project Title")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("project-description")
      .setLabel("Project Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    const clientNameInput = new TextInputBuilder()
      .setCustomId("client-name")
      .setLabel("Client Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const clientEmailInput = new TextInputBuilder()
      .setCustomId("client-email")
      .setLabel("Client Email")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Add inputs to action rows (max 5 per modal)
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      titleInput,
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      descriptionInput,
    );
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      clientNameInput,
    );
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      clientEmailInput,
    );

    modal.addComponents(row1, row2, row3, row4);

    // Show modal to user
    await interaction.showModal(modal);
  },
};
```

```ts
// bot/events/interactionCreate.ts (modal handler)
if (interaction.isModalSubmit()) {
  if (interaction.customId === "create-project-modal") {
    // Extract values
    const title = interaction.fields.getTextInputValue("project-title");
    const description = interaction.fields.getTextInputValue(
      "project-description",
    );
    const clientName = interaction.fields.getTextInputValue("client-name");
    const clientEmail = interaction.fields.getTextInputValue("client-email");

    try {
      // Create project via API
      const project = await createProject({
        title,
        description,
        clientName,
        clientEmail,
        status: "PLANNING",
      });

      await interaction.reply({
        content: `✅ Project created: **${project.title}** (ID: \`${project.id}\`)`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: "❌ Failed to create project",
        ephemeral: true,
      });
    }
  }
}
```

---

## Embed Pagination

### Pattern: Paginated Embeds with Buttons

```ts
// bot/commands/list-projects.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { Project } from "@prisma/client";

export default {
  data: new SlashCommandBuilder()
    .setName("list-projects")
    .setDescription("List all projects"),

  async run(interaction: ChatInputCommandInteraction) {
    const projects = await fetchProjects(); // Fetch from API

    const itemsPerPage = 5;
    const totalPages = Math.ceil(projects.length / itemsPerPage);

    async function generateEmbed(page: number): Promise<EmbedBuilder> {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageProjects = projects.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle("Projects")
        .setDescription(
          pageProjects
            .map(
              (p, i) =>
                `**${start + i + 1}.** ${p.title}\n` +
                `   Status: ${p.status} | Client: ${p.clientName}`,
            )
            .join("\n\n"),
        )
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

      return embed;
    }

    function generateButtons(page: number): ActionRowBuilder<ButtonBuilder> {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("projects-first")
          .setLabel("⏮️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("projects-prev")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("projects-next")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId("projects-last")
          .setLabel("⏭️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
      );
    }

    let currentPage = 0;

    const message = await interaction.followUp({
      embeds: [await generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
      ephemeral: true,
    });

    // Create button collector
    const collector = message.createMessageComponentCollector({
      time: 5 * 60 * 1000, // 5 minutes
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: "These buttons are not for you!",
          ephemeral: true,
        });
        return;
      }

      switch (buttonInteraction.customId) {
        case "projects-first":
          currentPage = 0;
          break;
        case "projects-prev":
          currentPage = Math.max(0, currentPage - 1);
          break;
        case "projects-next":
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case "projects-last":
          currentPage = totalPages - 1;
          break;
      }

      await buttonInteraction.update({
        embeds: [await generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on("end", () => {
      // Disable buttons after timeout
      message.edit({ components: [] });
    });
  },
};
```

---

## Advanced Permission Checks

### Pattern: Role-Based Permissions

```ts
// bot/utils/permissions.ts (expanded from codebase)
import type { PermissionLevel, BotConfig } from "../types";
import type { GuildMember } from "discord.js";

export function validatePermission(
  userId: string,
  requiredLevel: PermissionLevel,
  config: BotConfig,
): boolean {
  // Admin IDs have all permissions
  if (config.adminUserIds.includes(userId)) {
    return true;
  }

  // Check permission level
  switch (requiredLevel) {
    case "admin":
      return config.adminUserIds.includes(userId);
    case "moderator":
      return (
        config.moderatorUserIds?.includes(userId) ||
        config.adminUserIds.includes(userId)
      );
    case "member":
      return true; // All authenticated users
    default:
      return false;
  }
}

export function validateRolePermission(
  member: GuildMember,
  requiredRoles: string[],
): boolean {
  return requiredRoles.some((roleId) => member.roles.cache.has(roleId));
}

export function validateChannelPermission(
  channelId: string,
  allowedChannels: string[],
): boolean {
  return allowedChannels.includes(channelId);
}
```

### Pattern: Permission Middleware

```ts
// bot/decorators/permissions.ts
export function RequireRole(...roleIds: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      interaction: ChatInputCommandInteraction,
    ) {
      if (!interaction.guild || !interaction.member) {
        await interaction.followUp({
          content: "❌ This command requires guild membership",
          ephemeral: true,
        });
        return;
      }

      const member = interaction.member as GuildMember;
      const hasRole = roleIds.some((roleId) => member.roles.cache.has(roleId));

      if (!hasRole) {
        await interaction.followUp({
          content: "❌ You do not have the required role for this command",
          ephemeral: true,
        });
        return;
      }

      return originalMethod.call(this, interaction);
    };

    return descriptor;
  };
}
```

---

## Best Practices Summary

### Event Handling

- ✅ Use event loader for dynamic event registration
- ✅ Handle all interaction types (commands, buttons, modals)
- ✅ Defer replies immediately (3-second timeout)
- ❌ Don't block event loop with long operations

### Commands

- ✅ Extend BaseCommand for validation middleware
- ✅ Use permissions for access control
- ✅ Implement error handling
- ❌ Don't forget to defer long-running commands

### Components

- ✅ Use buttons for confirmations
- ✅ Use select menus for choices
- ✅ Use modals for multi-field input
- ✅ Include identifiers in customId (e.g., `action:id`)
- ❌ Don't create too many buttons (max 5 per row, 5 rows per message)

### Embeds

- ✅ Use pagination for long lists
- ✅ Add navigation buttons
- ✅ Set collector timeout (clean up)
- ❌ Don't exceed embed limits (25 fields, 6000 chars total)

### Permissions

- ✅ Check permissions before executing commands
- ✅ Use role-based access control
- ✅ Provide clear error messages
- ❌ Don't hardcode user IDs (use config)

---

## Related Documentation

- [Discord.js Documentation](https://discord.js.org/)
- [Discord API Documentation](https://discord.com/developers/docs/intro)
- [Bot Architecture](../../architecture/decisions/ADR-004-discord-js-framework.md)
- [Testing Bot Commands](./testing-patterns.md#discord-bot-testing)

**Last Updated:** 2026-01-07
