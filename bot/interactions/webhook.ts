/**
 * Vercel Discord Interactions Webhook Handler
 *
 * Handles incoming Discord interactions via webhook (stateless)
 *
 * @module bot/interactions/webhook
 */

import { InteractionType, InteractionResponseType } from 'discord-api-types/v10';
import type { APIInteraction } from 'discord-api-types/v10';
import { verifyDiscordSignature } from './verify';
import { botLogger } from '../core/logger';
import { ValidationError } from '../core/errors';

/**
 * Handle Discord interaction webhook
 *
 * @param request - HTTP request
 * @returns HTTP response
 */
export async function handleInteraction(request: Request): Promise<Response> {
  try {
    // Get signature headers
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');

    // Get public key from environment
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
      botLogger.error('DISCORD_PUBLIC_KEY not configured');
      return new Response('Internal server error', { status: 500 });
    }

    // Read body as text
    const body = await request.text();

    // Verify signature
    try {
      await verifyDiscordSignature({
        body,
        signature,
        timestamp,
        publicKey,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        botLogger.warn('Invalid interaction signature', {
          error: error.message,
        });
        return new Response('Invalid signature', { status: 401 });
      }
      throw error;
    }

    // Parse interaction
    const interaction: APIInteraction = JSON.parse(body);

    // Handle PING (Discord verification)
    if (interaction.type === InteractionType.Ping) {
      botLogger.info('Received PING from Discord');
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.Pong,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle ApplicationCommand
    if (interaction.type === InteractionType.ApplicationCommand) {
      botLogger.info('Received command interaction', {
        command: interaction.data.name,
        userId: interaction.member?.user?.id || interaction.user?.id,
      });

      // TODO: Route to command handlers
      // For now, defer the interaction
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.DeferredChannelMessageWithSource,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Unknown interaction type
    botLogger.warn('Unknown interaction type', {
      type: interaction.type,
    });

    return new Response('Unknown interaction type', { status: 400 });
  } catch (error) {
    const err = error as Error;
    botLogger.error('Interaction handler error', {
      error: err.message,
      stack: err.stack,
    });

    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Export POST handler for Vercel Edge Function
 */
export async function POST(request: Request): Promise<Response> {
  return handleInteraction(request);
}
