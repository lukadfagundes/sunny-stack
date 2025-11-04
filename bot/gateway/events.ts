/**
 * Gateway Event Handler Registry
 *
 * Registers all event handlers for the Gateway bot
 *
 * @module bot/gateway/events
 */

import { Client, Events } from 'discord.js';
import type { BotConfig } from '../types';
import { botLogger } from '../core/logger';

/**
 * Register all event handlers
 *
 * @param client - Discord client
 * @param config - Bot configuration
 */
export function registerEventHandlers(client: Client, config: BotConfig): void {
  botLogger.info('Registering event handlers...');

  // Ready event
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      const { handleReady } = await import('../events/ready');
      await handleReady(readyClient);
    } catch (error) {
      const err = error as Error;
      botLogger.error('Ready handler error', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // Interaction Create event
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      const { handleInteractionCreate } = await import('../events/interaction-create');
      await handleInteractionCreate(interaction);
    } catch (error) {
      const err = error as Error;
      botLogger.error('Interaction handler error', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // Message Create event
  client.on(Events.MessageCreate, async (message) => {
    try {
      const { handleMessageCreate } = await import('../events/message-create');
      await handleMessageCreate(message);
    } catch (error) {
      const err = error as Error;
      botLogger.error('Message handler error', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // Error event
  client.on(Events.Error, (error) => {
    try {
      const { handleError } = require('../events/error');
      handleError(error);
    } catch (err) {
      botLogger.error('Error handler failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  // Guild Member Add event
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const { handleGuildMemberAdd } = await import('../events/guild-member-add');
      await handleGuildMemberAdd(member);
    } catch (error) {
      const err = error as Error;
      botLogger.error('Guild member add handler error', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  botLogger.info('Event handlers registered', {
    handlers: [
      'ClientReady',
      'InteractionCreate',
      'MessageCreate',
      'Error',
      'GuildMemberAdd',
    ],
  });
}
