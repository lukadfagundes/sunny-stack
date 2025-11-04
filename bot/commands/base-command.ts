/**
 * Base Command Abstract Class
 *
 * Provides common functionality for all slash commands
 *
 * @module bot/commands/base-command
 */

import type { CommandInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command, PermissionLevel, BotConfig } from '../types';
import { validatePermission } from '../utils/permissions';
import { checkRateLimit } from '../utils/rate-limiter';
import { logCommandExecution, botLogger } from '../core/logger';
import { PermissionError, RateLimitError, ValidationError } from '../core/errors';

/**
 * Base command abstract class
 *
 * All commands should extend this class
 */
export abstract class BaseCommand implements Command {
  abstract data: SlashCommandBuilder;
  abstract permissions?: PermissionLevel;

  /**
   * Execute command with built-in error handling and validation
   *
   * @param interaction - Command interaction
   * @param config - Bot configuration
   */
  async executeWithValidation(
    interaction: CommandInteraction,
    config: BotConfig
  ): Promise<void> {
    const startTime = Date.now();
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    try {
      // 1. Permission validation
      if (this.permissions) {
        const hasPermission = validatePermission(userId, this.permissions, config);
        if (!hasPermission) {
          throw new PermissionError(
            'You do not have permission to use this command',
            userId,
            this.permissions
          );
        }
      }

      // 2. Rate limit check
      const rateLimitResult = checkRateLimit(userId);
      if (!rateLimitResult.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}ms`,
          rateLimitResult.retryAfter
        );
      }

      // 3. Type validation and execution
      if (!interaction.isChatInputCommand()) {
        await interaction.reply({
          content: '❌ Invalid command type. This command only works as a chat input command.',
          ephemeral: true,
        });
        return;
      }

      // 4. Execute command with properly typed interaction
      await this.run(interaction);

      // 4. Log success
      const executionTime = Date.now() - startTime;
      logCommandExecution({
        command: commandName,
        userId,
        success: true,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Handle specific error types
      if (error instanceof PermissionError) {
        await this.handlePermissionError(interaction, error);
      } else if (error instanceof RateLimitError) {
        await this.handleRateLimitError(interaction, error);
      } else if (error instanceof ValidationError) {
        await this.handleValidationError(interaction, error);
      } else {
        await this.handleUnknownError(interaction, error as Error);
      }

      // Log failure
      logCommandExecution({
        command: commandName,
        userId,
        success: false,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Execute command (must be implemented by subclasses)
   *
   * @deprecated Use run() instead - this method is kept for backward compatibility
   */
  async execute(interaction: CommandInteraction): Promise<void> {
    // Type guard for ChatInputCommandInteraction
    if (!interaction.isChatInputCommand()) {
      await interaction.reply({
        content: '❌ Invalid command type. This command only works as a chat input command.',
        ephemeral: true,
      });
      return;
    }

    // Delegate to run() with properly typed interaction
    await this.run(interaction);
  }

  /**
   * Run command with type-safe ChatInputCommandInteraction
   *
   * This method provides access to interaction.options which is not available
   * on the base CommandInteraction type.
   *
   * @param interaction - ChatInputCommandInteraction with options property
   */
  abstract run(interaction: ChatInputCommandInteraction): Promise<void>;

  /**
   * Handle permission error
   */
  private async handlePermissionError(
    interaction: CommandInteraction,
    error: PermissionError
  ): Promise<void> {
    const reply = {
      content: '❌ **Access Denied**\n\nYou do not have permission to use this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }

  /**
   * Handle rate limit error
   */
  private async handleRateLimitError(
    interaction: CommandInteraction,
    error: RateLimitError
  ): Promise<void> {
    const seconds = Math.ceil(error.retryAfter / 1000);
    const reply = {
      content: `⏱️ **Rate Limit Exceeded**\n\nPlease wait ${seconds} seconds before using this command again.`,
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }

  /**
   * Handle validation error
   */
  private async handleValidationError(
    interaction: CommandInteraction,
    error: ValidationError
  ): Promise<void> {
    const reply = {
      content: `❌ **Validation Error**\n\n${error.message}${error.field ? `\n\nField: \`${error.field}\`` : ''}`,
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }

  /**
   * Handle unknown error
   */
  private async handleUnknownError(
    interaction: CommandInteraction,
    error: Error
  ): Promise<void> {
    botLogger.error('Command execution error', {
      command: interaction.commandName,
      userId: interaction.user.id,
      error: error.message,
      stack: error.stack,
    });

    const reply = {
      content: '❌ **An unexpected error occurred**\n\nPlease try again later.',
      ephemeral: true,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (replyError) {
      // If we can't reply, log the error
      botLogger.error('Failed to send error message to user', {
        error: replyError instanceof Error ? replyError.message : 'Unknown error',
      });
    }
  }

  /**
   * Defer reply for long-running commands
   *
   * NOTE: As of INV-003, interaction handler now defers globally.
   * This method is kept for backward compatibility but does nothing.
   * The interaction is already deferred when commands execute.
   *
   * @param interaction - Command interaction
   * @param ephemeral - Whether to make the reply ephemeral (IGNORED - handler defers all)
   * @deprecated Interaction is now deferred globally in the handler
   */
  protected async deferReply(
    interaction: CommandInteraction,
    ephemeral = false
  ): Promise<void> {
    // No-op: Handler already deferred the interaction immediately upon receipt
    // This prevents double-deferral and maintains backward compatibility
    return;
  }
}
