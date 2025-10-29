/**
 * Webhook Signature Verification
 *
 * Provides secure signature verification for GitHub and Vercel webhooks
 * using HMAC-based signatures with timing-attack protection.
 *
 * Security Features:
 * - HMAC-SHA256 for GitHub webhooks
 * - HMAC-SHA1 for Vercel webhooks
 * - crypto.timingSafeEqual for constant-time comparison (timing attack protection)
 * - Handles null/undefined inputs gracefully
 */

import crypto from 'crypto';

/**
 * Generate HMAC signature for a payload
 *
 * @param payload - Raw payload string to sign
 * @param secret - Secret key for HMAC generation
 * @param algorithm - Hash algorithm (e.g., 'sha256', 'sha1')
 * @returns Hex-encoded HMAC signature
 */
export function generateHmacSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' | string
): string {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Verify GitHub webhook signature
 *
 * GitHub uses HMAC-SHA256 and sends signature in format: "sha256={hash}"
 * via the x-hub-signature-256 header.
 *
 * @param payload - Raw payload string (request body as string)
 * @param signature - Signature from x-hub-signature-256 header
 * @param secret - GitHub webhook secret
 * @returns True if signature is valid, false otherwise
 */
export function verifyGitHubWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Handle null/undefined inputs (allow empty string for payload)
    if (payload === null || payload === undefined ||
        signature === null || signature === undefined ||
        secret === null || secret === undefined ||
        !signature || !secret) {
      return false;
    }

    // GitHub signature format: "sha256={hash}"
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    // Extract the hash part (remove "sha256=" prefix)
    const receivedHash = signature.slice(7); // "sha256=".length === 7

    // Generate expected signature
    const expectedHash = generateHmacSignature(payload, secret, 'sha256');

    // Convert to buffers for constant-time comparison
    const receivedBuffer = Buffer.from(receivedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    // Check if buffers are the same length (required for timingSafeEqual)
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (error) {
    // Handle any errors gracefully (e.g., invalid hex string)
    return false;
  }
}

/**
 * Verify Vercel webhook signature
 *
 * Vercel uses HMAC-SHA1 and sends signature as hex string
 * via the x-vercel-signature header.
 *
 * @param payload - Raw payload string (request body as string)
 * @param signature - Signature from x-vercel-signature header
 * @param secret - Vercel webhook secret
 * @returns True if signature is valid, false otherwise
 */
export function verifyVercelWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Handle null/undefined inputs
    if (payload === null || payload === undefined ||
        signature === null || signature === undefined ||
        secret === null || secret === undefined) {
      return false;
    }

    // Generate expected signature (Vercel uses SHA1)
    const expectedHash = generateHmacSignature(payload, secret, 'sha1');

    // Convert to buffers for constant-time comparison
    const receivedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    // Check if buffers are the same length (required for timingSafeEqual)
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (error) {
    // Handle any errors gracefully (e.g., invalid hex string)
    return false;
  }
}
