/**
 * Discord Interaction Signature Verification
 *
 * Verifies incoming interactions from Discord using Ed25519 signatures
 *
 * @module bot/interactions/verify
 */

import { ValidationError } from '../core/errors';
import { botLogger } from '../core/logger';

/**
 * Verify Discord interaction signature
 *
 * @param body - Raw request body (string)
 * @param signature - X-Signature-Ed25519 header
 * @param timestamp - X-Signature-Timestamp header
 * @param publicKey - Discord application public key
 * @returns True if signature is valid
 * @throws {ValidationError} If signature is invalid or missing
 */
export async function verifyDiscordSignature(params: {
  body: string;
  signature: string | null;
  timestamp: string | null;
  publicKey: string;
}): Promise<boolean> {
  const { body, signature, timestamp, publicKey } = params;

  // Check required headers
  if (!signature) {
    botLogger.warn('Missing signature header');
    throw new ValidationError('Missing X-Signature-Ed25519 header', 'signature');
  }

  if (!timestamp) {
    botLogger.warn('Missing timestamp header');
    throw new ValidationError('Missing X-Signature-Timestamp header', 'timestamp');
  }

  try {
    // Dynamically import ES module at runtime
    const { verify } = await import('@noble/ed25519');

    // Construct message (timestamp + body)
    const message = timestamp + body;

    // Convert to Uint8Arrays
    const messageBuffer = new TextEncoder().encode(message);
    const signatureBuffer = hexToUint8Array(signature);
    const publicKeyBuffer = hexToUint8Array(publicKey);

    // Verify signature using Ed25519
    const isValid = await verify(signatureBuffer, messageBuffer, publicKeyBuffer);

    if (!isValid) {
      botLogger.warn('Invalid Discord signature', {
        timestamp,
      });
      throw new ValidationError('Invalid Discord signature', 'signature');
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    const err = error as Error;
    botLogger.error('Signature verification failed', {
      error: err.message,
    });

    throw new ValidationError(
      `Signature verification failed: ${err.message}`,
      'signature'
    );
  }
}

/**
 * Convert hex string to Uint8Array
 *
 * @param hex - Hex string
 * @returns Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Timing-safe string comparison
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
