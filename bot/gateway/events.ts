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
import { handleReady } from '../events/ready';
import { handleInteractionCreate } from '../events/interaction-create';
import { handleMessageCreate } from '../events/message-create';
import { handleError } from '../events/error';
import { handleGuildMemberAdd } from '../events/guild-member-add';

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
      await handleReady(readyClient);
    } catch (error) {
      const err = error as Error;
      botLogger.error('Ready handler error', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // Interaction Create event - CRITICAL: Use nextTick for highest priority
  client.on(Events.InteractionCreate, (interaction) => {
    const eventReceived = Date.now();

    // Process on next tick to ensure this runs before setImmediate callbacks
    process.nextTick(async () => {
      const handlerStarted = Date.now();
      const queueDelay = handlerStarted - eventReceived;

      if (queueDelay > 50) {
        botLogger.warn('Slow interaction handler queue', {
          queueDelay,
          interactionType: interaction.type,
        });
      }

      try {
        await handleInteractionCreate(interaction);
      } catch (error) {
        const err = error as Error;
        botLogger.error('Interaction handler error', {
          error: err.message,
          stack: err.stack,
        });
      }
    });
  });

  // Message Create event
  client.on(Events.MessageCreate, async (message) => {
    try {
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
