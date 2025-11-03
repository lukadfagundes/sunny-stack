/**
 * @file Example Gmail Service Implementation
 * @description Demonstrates how to extend GoogleServiceBase for Gmail API
 * @module lib/google/example-gmail-service
 *
 * NOTE: This is an example implementation showing how to use GoogleServiceBase.
 * For production use, install @googleapis/gmail package:
 * npm install @googleapis/gmail googleapis
 */

import { GoogleServiceBase } from './base-service';
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';

/**
 * Email message interface
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

/**
 * Gmail Service
 *
 * Example implementation of GoogleServiceBase for Gmail API.
 * Provides email sending, reading, and management capabilities.
 *
 * @example
 * ```typescript
 * const gmailService = new GmailService();
 *
 * // Send email
 * await gmailService.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   body: 'This is a test email'
 * });
 *
 * // List messages
 * const messages = await gmailService.listMessages({ maxResults: 10 });
 *
 * // Get message by ID
 * const message = await gmailService.getMessage('msg_id_123');
 * ```
 */
export class GmailService extends GoogleServiceBase<gmail_v1.Gmail> {
  /**
   * Get service name for quota management
   */
  getServiceName(): 'gmail' {
    return 'gmail';
  }

  /**
   * Get Gmail API quota limits
   * Source: https://developers.google.com/gmail/api/reference/quota
   */
  getQuotaLimits() {
    return {
      perMinute: 250,
      perDay: 1_000_000,
    };
  }

  /**
   * Create Gmail API client with OAuth2 authentication
   */
  async createClient(): Promise<gmail_v1.Gmail> {
    const auth = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.redirectUri
    );

    // Set access token if available
    if (this.accessToken) {
      auth.setCredentials({ access_token: this.accessToken });
    }

    return google.gmail({ version: 'v1', auth });
  }

  /**
   * Send an email
   *
   * @param message - Email message details
   * @returns Message ID of sent email
   *
   * @example
   * ```typescript
   * const messageId = await gmailService.sendEmail({
   *   to: 'recipient@example.com',
   *   subject: 'Hello World',
   *   body: 'This is the email body'
   * });
   * console.log(`Email sent: ${messageId}`);
   * ```
   */
  async sendEmail(message: EmailMessage): Promise<string> {
    // Check cache first
    const cacheKey = this.generateCacheKey('sendEmail', message);
    const cached = this.getCached<string>(cacheKey);
    if (cached) {
      return cached;
    }

    // Send email with retry logic
    const result = await this.executeWithRetry(async () => {
      const email = this.createEmailMessage(message);

      const response = await this.client.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: email,
        },
      });

      return response.data.id!;
    });

    // Cache result for 1 minute (emails don't need long caching)
    this.setCached(cacheKey, result, 60000);

    return result;
  }

  /**
   * List messages in inbox
   *
   * @param options - List options (maxResults, pageToken, etc.)
   * @returns Array of message metadata
   *
   * @example
   * ```typescript
   * const messages = await gmailService.listMessages({
   *   maxResults: 20,
   *   labelIds: ['INBOX', 'UNREAD']
   * });
   * ```
   */
  async listMessages(options: {
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  } = {}): Promise<gmail_v1.Schema$Message[]> {
    // Check cache
    const cacheKey = this.generateCacheKey('listMessages', options);
    const cached = this.getCached<gmail_v1.Schema$Message[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // List messages with retry logic
    const result = await this.executeWithRetry(async () => {
      const response = await this.client.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults || 10,
        pageToken: options.pageToken,
        labelIds: options.labelIds,
      });

      return response.data.messages || [];
    });

    // Cache for 5 minutes
    this.setCached(cacheKey, result, 300000);

    return result;
  }

  /**
   * Get a specific message by ID
   *
   * @param messageId - Gmail message ID
   * @returns Full message details
   *
   * @example
   * ```typescript
   * const message = await gmailService.getMessage('msg_abc123');
   * console.log(message.snippet); // Preview text
   * ```
   */
  async getMessage(messageId: string): Promise<gmail_v1.Schema$Message> {
    // Check cache
    const cacheKey = this.generateCacheKey('getMessage', { messageId });
    const cached = this.getCached<gmail_v1.Schema$Message>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get message with retry logic
    const result = await this.executeWithRetry(async () => {
      const response = await this.client.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      return response.data;
    });

    // Cache for 10 minutes
    this.setCached(cacheKey, result, 600000);

    return result;
  }

  /**
   * Delete a message
   *
   * @param messageId - Gmail message ID
   *
   * @example
   * ```typescript
   * await gmailService.deleteMessage('msg_abc123');
   * ```
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.executeWithRetry(async () => {
      await this.client.users.messages.delete({
        userId: 'me',
        id: messageId,
      });
    });
  }

  /**
   * Create base64-encoded email message
   * @private
   */
  private createEmailMessage(message: EmailMessage): string {
    const email = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      message.from ? `From: ${message.from}` : '',
      '',
      message.body,
    ]
      .filter(Boolean)
      .join('\r\n');

    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Initialize service
 * const gmailService = new GmailService();
 *
 * // Send email
 * try {
 *   const messageId = await gmailService.sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Test Email',
 *     body: 'This is a test message from GmailService'
 *   });
 *   console.log(`Email sent successfully: ${messageId}`);
 * } catch (error) {
 *   console.error('Failed to send email:', error);
 * }
 *
 * // List recent messages
 * const messages = await gmailService.listMessages({ maxResults: 5 });
 * console.log(`Found ${messages.length} messages`);
 *
 * // Get specific message
 * if (messages.length > 0) {
 *   const message = await gmailService.getMessage(messages[0].id!);
 *   console.log('Subject:', message.snippet);
 * }
 * ```
 */
