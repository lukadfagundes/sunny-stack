/**
 * Integration Tests: Webhook Notification Flow
 *
 * Tests webhook signature verification and notification delivery
 */

import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/discord/webhooks/route';

// Mock Discord client and notification senders
jest.mock('@/bot/core/client');
jest.mock('@/bot/notifications/quote-notifications');
jest.mock('@/bot/notifications/project-notifications');
jest.mock('@/bot/notifications/proposal-notifications');
jest.mock('@/bot/notifications/monitoring-notifications');

describe('Integration: Webhook Notifications', () => {
  const webhookSecret = 'test-webhook-secret-key';

  beforeEach(() => {
    process.env.DISCORD_WEBHOOK_SECRET = webhookSecret;

    // Mock Discord client
    const { createDiscordClient, connectClient } = require('@/bot/core/client');
    createDiscordClient.mockReturnValue({
      isReady: () => true,
    });
    connectClient.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.DISCORD_WEBHOOK_SECRET;
    jest.clearAllMocks();
  });

  function createSignature(body: string, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }

  function createWebhookRequest(params: {
    body: any;
    eventType: string;
    secret?: string;
  }): NextRequest {
    const bodyString = JSON.stringify(params.body);
    const signature = createSignature(bodyString, params.secret || webhookSecret);
    const timestamp = new Date().toISOString();

    return new NextRequest('http://localhost:3000/api/discord/webhooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event': params.eventType,
      },
      body: bodyString,
    });
  }

  describe('Signature Verification', () => {
    it('should accept valid webhook signatures', async () => {
      const { handleQuoteWebhook } = require('@/bot/notifications/quote-notifications');
      handleQuoteWebhook.mockResolvedValue(undefined);

      const payload = {
        quote: {
          id: 'quote_1',
          name: 'Test Client',
          email: 'test@example.com',
          projectType: 'Web App',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        eventType: 'new',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'quote.new',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(handleQuoteWebhook).toHaveBeenCalled();
    });

    it('should reject invalid signatures', async () => {
      const payload = {
        quote: {
          id: 'quote_1',
          name: 'Test Client',
          email: 'test@example.com',
        },
        eventType: 'new',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'quote.new',
        secret: 'wrong-secret',
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should reject webhooks with old timestamps', async () => {
      const bodyString = JSON.stringify({ test: 'data' });
      const signature = createSignature(bodyString, webhookSecret);
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

      const request = new NextRequest('http://localhost:3000/api/discord/webhooks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': oldTimestamp,
          'x-webhook-event': 'quote.new',
        },
        body: bodyString,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should reject webhooks without signatures', async () => {
      const request = new NextRequest('http://localhost:3000/api/discord/webhooks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-timestamp': new Date().toISOString(),
          'x-webhook-event': 'quote.new',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Quote Notifications', () => {
    it('should handle quote.new events', async () => {
      const { handleQuoteWebhook } = require('@/bot/notifications/quote-notifications');
      handleQuoteWebhook.mockResolvedValue(undefined);

      const payload = {
        quote: {
          id: 'quote_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'ACME Corp',
          projectType: 'E-commerce Site',
          budgetRange: '$10k-$25k',
          timeline: '3 months',
          description: 'Need a new e-commerce platform',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        eventType: 'new',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'quote.new',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleQuoteWebhook).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          quote: expect.objectContaining({ id: 'quote_1' }),
          eventType: 'new',
        })
      );
    });

    it('should handle quote.converted events', async () => {
      const { handleQuoteWebhook } = require('@/bot/notifications/quote-notifications');
      handleQuoteWebhook.mockResolvedValue(undefined);

      const payload = {
        quote: {
          id: 'quote_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          projectType: 'Web App',
          status: 'CONVERTED',
          createdAt: new Date().toISOString(),
        },
        project: {
          id: 'proj_1',
          title: 'Jane Doe - Web App',
        },
        eventType: 'converted',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'quote.converted',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleQuoteWebhook).toHaveBeenCalled();
    });
  });

  describe('Project Notifications', () => {
    it('should handle project.created events', async () => {
      const { handleProjectWebhook } = require('@/bot/notifications/project-notifications');
      handleProjectWebhook.mockResolvedValue(undefined);

      const payload = {
        project: {
          id: 'proj_1',
          title: 'New Project',
          clientName: 'Client Name',
          clientEmail: 'client@example.com',
          status: 'PLANNING',
          budget: 25000,
          deadline: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        eventType: 'created',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'project.created',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleProjectWebhook).toHaveBeenCalled();
    });

    it('should handle project.status_changed events', async () => {
      const { handleProjectWebhook } = require('@/bot/notifications/project-notifications');
      handleProjectWebhook.mockResolvedValue(undefined);

      const payload = {
        project: {
          id: 'proj_1',
          title: 'Project Name',
          clientName: 'Client',
          clientEmail: 'client@example.com',
          status: 'IN_PROGRESS',
          budget: 25000,
          deadline: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        eventType: 'status_changed',
        changes: [
          {
            field: 'status',
            oldValue: 'PLANNING',
            newValue: 'IN_PROGRESS',
          },
        ],
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'project.status_changed',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Monitoring Notifications', () => {
    it('should handle monitoring.alert events', async () => {
      const { handleMonitoringWebhook } = require('@/bot/notifications/monitoring-notifications');
      handleMonitoringWebhook.mockResolvedValue(undefined);

      const payload = {
        alert: {
          id: 'alert_1',
          type: 'UPTIME_CHECK',
          severity: 'CRITICAL',
          source: 'Fly.io',
          message: 'Service is down',
          timestamp: new Date().toISOString(),
        },
        service: {
          name: 'web-app',
          status: 'down',
          uptime: 99.5,
        },
        eventType: 'alert',
      };

      const request = createWebhookRequest({
        body: payload,
        eventType: 'monitoring.alert',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleMonitoringWebhook).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown event types', async () => {
      const request = createWebhookRequest({
        body: { test: 'data' },
        eventType: 'unknown.event',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle missing webhook secret', async () => {
      delete process.env.DISCORD_WEBHOOK_SECRET;

      const request = createWebhookRequest({
        body: { test: 'data' },
        eventType: 'quote.new',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
