/**
 * Discord Interactions API Route (Vercel Edge Function)
 *
 * Receives Discord interactions via webhook
 *
 * @route POST /api/discord/interactions
 */

export { POST } from '@/bot/interactions/webhook';

// Configure as Edge Runtime for fast cold starts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
