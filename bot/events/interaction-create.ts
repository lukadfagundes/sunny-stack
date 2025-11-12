/**
 * Interaction Create Event Handler
 *
 * Handles all Discord interactions (slash commands, buttons, etc.)
 *
 * @module bot/events/interaction-create
 */

import { Client, Events, Interaction, CommandInteraction } from 'discord.js';
import { botLogger, logCommandExecution } from '../core/logger';
import { commandRegistry } from '../commands/registry';
import { loadBotConfig } from '../config';
import { createErrorEmbed } from '../utils/embed-builder';
import { PermissionError, RateLimitError, ValidationError } from '../core/errors';

/**
 * Handle interaction create event
 */
export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  // Handle autocomplete interactions
  if (interaction.isAutocomplete()) {
    const commandName = interaction.commandName;
    const command = commandRegistry.get(commandName);

    if (command && 'autocomplete' in command && typeof command.autocomplete === 'function') {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        botLogger.error('Autocomplete error', {
          command: commandName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return;
  }

  // Only handle slash commands
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const startTime = Date.now();
  const commandName = interaction.commandName;

  // CRITICAL: Defer IMMEDIATELY before any logging or processing
  // Must acknowledge within 3 seconds or interaction becomes invalid
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
  } catch (deferError) {
    // Log defer failure asynchronously to avoid blocking
    setImmediate(() => {
      botLogger.error('Failed to defer interaction', {
        command: commandName,
        error: deferError instanceof Error ? deferError.message : String(deferError),
        timeSinceCommand: Date.now() - startTime,
        interactionId: interaction.id,
      });
    });
    return;
  }

  // Now log after defer succeeded (non-blocking)
  setImmediate(() => {
    botLogger.info('Command received', {
      command: commandName,
      userId: interaction.user.id,
      username: interaction.user.tag,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      deferTime: Date.now() - startTime,
    });
  });

  try {
    // Get command from registry
    const command = commandRegistry.get(commandName);

    if (!command) {
      botLogger.warn('Unknown command received', { command: commandName });
      await interaction.followUp({
        content: `⚠️ Unknown command: \`/${commandName}\``,
        flags: 64, // Ephemeral
      });
      return;
    }

    // Execute command with validation (includes permission check, rate limiting, etc.)
    const config = loadBotConfig();

    if ('executeWithValidation' in command && typeof command.executeWithValidation === 'function') {
      await command.executeWithValidation(interaction as CommandInteraction, config);
    } else if ('execute' in command && typeof command.execute === 'function') {
      // Fallback for commands without BaseCommand
      await command.execute(interaction as CommandInteraction);
    } else {
      throw new Error(`Command ${commandName} does not have a valid execute method`);
    }

    const executionTime = Date.now() - startTime;

    logCommandExecution({
      command: commandName,
      userId: interaction.user.id,
      success: true,
      executionTime,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logCommandExecution({
      command: commandName,
      userId: interaction.user.id,
      success: false,
      executionTime,
      error: error instanceof Error ? error.message : String(error),
    });

    // Handle different error types
    await handleCommandError(interaction as CommandInteraction, error);
  }
}

/**
 * Handle command execution errors
 */
async function handleCommandError(
  interaction: CommandInteraction,
  error: unknown
): Promise<void> {
  let errorMessage = 'An unexpected error occurred.';
  const ephemeral = true;

  if (error instanceof PermissionError) {
    errorMessage = 'You do not have permission to use this command.';
  } else if (error instanceof RateLimitError) {
    const retryAfter = Math.ceil((error as any).retryAfter / 1000);
    errorMessage = `You are being rate limited. Try again in ${retryAfter} seconds.`;
  } else if (error instanceof ValidationError) {
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    botLogger.error('Command execution error', {
      command: interaction.commandName,
      userId: interaction.user.id,
      error: error.message,
      stack: error.stack,
    });
  }

  const errorEmbed = createErrorEmbed('Command Error', errorMessage);

  // Try to reply or follow up depending on interaction state
  try {
    if (interaction.deferred) {
      await interaction.followUp({
        embeds: [errorEmbed],
        ephemeral,
      });
    } else if (interaction.replied) {
      await interaction.followUp({
        embeds: [errorEmbed],
        ephemeral,
      });
    } else {
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral,
      });
    }
  } catch (replyError) {
    botLogger.error('Failed to send error message', {
      command: interaction.commandName,
      error: replyError instanceof Error ? replyError.message : String(replyError),
    });
  }
}

/**
 * Register the interaction create event handler
 */
export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, handleInteractionCreate);
}
