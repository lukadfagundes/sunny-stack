/**
 * Webhook Signature Verification
 *
 * Verifies HMAC signatures for incoming webhooks from the admin platform
 *
 * @module bot/notifications/verify-webhook
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { botLogger } from '../core/logger';
import { ValidationError } from '../core/errors';

/**
 * Verify webhook signature using HMAC-SHA256
 */
export function verifyWebhookSignature(params: {
  body: string;
  signature: string | null;
  secret: string;
}): boolean {
  const { body, signature, secret } = params;

  if (!signature) {
    botLogger.warn('Webhook signature missing');
    throw new ValidationError('Missing webhook signature');
  }

  try {
    // Create HMAC using SHA-256
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      botLogger.warn('Webhook signature length mismatch', {
        received: signatureBuffer.length,
        expected: expectedBuffer.length,
      });
      return false;
    }

    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      botLogger.warn('Webhook signature verification failed');
    }

    return isValid;
  } catch (error) {
    botLogger.error('Error verifying webhook signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 */
export function verifyWebhookTimestamp(timestamp: string | null, maxAge = 300000): boolean {
  if (!timestamp) {
    botLogger.warn('Webhook timestamp missing');
    return false;
  }

  try {
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const age = currentTime - requestTime;

    if (age > maxAge) {
      botLogger.warn('Webhook timestamp too old', {
        age,
        maxAge,
        timestamp,
      });
      return false;
    }

    // Also reject future timestamps
    if (age < -60000) {
      // Allow 1 minute clock skew
      botLogger.warn('Webhook timestamp in future', {
        age,
        timestamp,
      });
      return false;
    }

    return true;
  } catch (error) {
    botLogger.error('Error verifying webhook timestamp', {
      error: error instanceof Error ? error.message : String(error),
      timestamp,
    });
    return false;
  }
}

/**
 * Verify complete webhook request (signature + timestamp)
 */
export function verifyWebhookRequest(params: {
  body: string;
  signature: string | null;
  timestamp: string | null;
  secret: string;
}): boolean {
  const { body, signature, timestamp, secret } = params;

  // Verify timestamp first (cheaper operation)
  if (!verifyWebhookTimestamp(timestamp)) {
    throw new ValidationError('Invalid or expired webhook timestamp');
  }

  // Verify signature
  if (!verifyWebhookSignature({ body, signature, secret })) {
    throw new ValidationError('Invalid webhook signature');
  }

  return true;
}
