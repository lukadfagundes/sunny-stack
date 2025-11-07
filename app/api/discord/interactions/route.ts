/**
 * Discord Interactions API Route (Node.js Runtime)
 *
 * Receives Discord interactions via webhook
 * Uses Node.js runtime to support winston file logging
 *
 * @route POST /api/discord/interactions
 */

export { POST } from '@/bot/interactions/webhook';

// Use Node.js runtime (required for winston file logging with DailyRotateFile)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
