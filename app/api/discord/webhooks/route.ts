/**
 * Discord Webhook Notifications API Route
 *
 * Receives webhook notifications from the admin platform and forwards to Discord
 *
 * @module app/api/discord/webhooks/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookRequest } from '@/bot/notifications/verify-webhook';
import { handleQuoteWebhook, QuoteNotificationPayload } from '@/bot/notifications/quote-notifications';
import { handleProjectWebhook, ProjectNotificationPayload } from '@/bot/notifications/project-notifications';
import { handleProposalWebhook, ProposalNotificationPayload } from '@/bot/notifications/proposal-notifications';
import { handleMonitoringWebhook, MonitoringNotificationPayload } from '@/bot/notifications/monitoring-notifications';
import { botLogger } from '@/bot/core/logger';
import { loadBotConfig } from '@/bot/config';
import { createDiscordClient, connectClient } from '@/bot/core/client';

export const runtime = 'nodejs'; // Cannot use edge runtime due to Discord.js dependencies
export const dynamic = 'force-dynamic';

// Singleton Discord client for webhook notifications
let discordClient: ReturnType<typeof createDiscordClient> | null = null;

/**
 * Get or create Discord client
 */
async function getDiscordClient(): Promise<ReturnType<typeof createDiscordClient>> {
  if (discordClient && discordClient.isReady()) {
    return discordClient;
  }

  const config = loadBotConfig();
  discordClient = createDiscordClient(config);
  await connectClient(discordClient, config);

  return discordClient;
}

/**
 * POST /api/discord/webhooks
 *
 * Receives webhook notifications from the admin platform
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get headers
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const eventType = request.headers.get('x-webhook-event');

    // Get body as text
    const body = await request.text();

    // Verify webhook signature
    const webhookSecret = process.env.DISCORD_WEBHOOK_SECRET;
    if (!webhookSecret) {
      botLogger.error('DISCORD_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    try {
      verifyWebhookRequest({
        body,
        signature,
        timestamp,
        secret: webhookSecret,
      });
    } catch (error) {
      botLogger.warn('Webhook verification failed', {
        error: error instanceof Error ? error.message : String(error),
        eventType,
      });
      return NextResponse.json(
        { error: 'Invalid webhook signature or timestamp' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Get Discord client
    const client = await getDiscordClient();

    // Route to appropriate handler based on event type
    switch (eventType) {
      case 'quote.new':
      case 'quote.approved':
      case 'quote.declined':
      case 'quote.converted':
        await handleQuoteWebhook(client, payload as QuoteNotificationPayload);
        break;

      case 'project.created':
      case 'project.updated':
      case 'project.status_changed':
      case 'project.deadline_approaching':
      case 'project.completed':
        await handleProjectWebhook(client, payload as ProjectNotificationPayload);
        break;

      case 'proposal.generated':
      case 'proposal.sent':
      case 'proposal.viewed':
      case 'proposal.accepted':
      case 'proposal.declined':
        await handleProposalWebhook(client, payload as ProposalNotificationPayload);
        break;

      case 'monitoring.alert':
      case 'monitoring.resolved':
      case 'monitoring.escalated':
        await handleMonitoringWebhook(client, payload as MonitoringNotificationPayload);
        break;

      default:
        botLogger.warn('Unknown webhook event type', { eventType });
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }

    botLogger.info('Webhook processed successfully', {
      eventType,
      payloadSize: body.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    botLogger.error('Error processing webhook', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
