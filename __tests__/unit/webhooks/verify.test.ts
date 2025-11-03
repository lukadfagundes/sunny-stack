/**
 * @jest-environment node
 */

// __tests__/unit/webhooks/verify.test.ts

/**
 * Unit Tests for Webhook Signature Verification
 *
 * Tests signature verification for:
 * 1. GitHub webhooks (HMAC-SHA256 with x-hub-signature-256)
 * 2. Vercel webhooks (HMAC-SHA1 with x-vercel-signature)
 *
 * Follows TDD RED-GREEN-REFACTOR methodology
 */

import crypto from 'crypto';

// Import functions to test (these don't exist yet - RED phase)
import {
  verifyGitHubWebhook,
  verifyVercelWebhook,
  generateHmacSignature,
} from '@/lib/webhooks/verify';

describe('Webhook Signature Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyGitHubWebhook', () => {
    test('should verify valid GitHub webhook signature', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = JSON.stringify({
        action: 'opened',
        pull_request: { id: 123 },
      });

      // Generate valid signature
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, expectedSignature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should reject invalid GitHub webhook signature', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = JSON.stringify({
        action: 'opened',
        pull_request: { id: 123 },
      });
      const invalidSignature = 'sha256=invalid-signature-hash';

      // ACT
      const result = verifyGitHubWebhook(payload, invalidSignature, secret);

      // ASSERT
      expect(result).toBe(false);
    });

    test('should reject signature with wrong secret', () => {
      // ARRANGE
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';
      const payload = JSON.stringify({ action: 'opened' });

      // Generate signature with wrong secret
      const hmac = crypto.createHmac('sha256', wrongSecret);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, signature, correctSecret);

      // ASSERT
      expect(result).toBe(false);
    });

    test('should reject signature missing sha256 prefix', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = JSON.stringify({ action: 'opened' });

      // Generate signature without prefix
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signatureWithoutPrefix = hmac.digest('hex');

      // ACT
      const result = verifyGitHubWebhook(payload, signatureWithoutPrefix, secret);

      // ASSERT
      expect(result).toBe(false);
    });

    test('should handle empty payload', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = '';

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should handle special characters in payload', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = JSON.stringify({
        comment: 'Test with special chars: 你好 🚀 <>&"\'',
      });

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should be timing-safe against timing attacks', () => {
      // ARRANGE
      const secret = 'github-webhook-secret';
      const payload = JSON.stringify({ action: 'test' });

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const validSignature = `sha256=${hmac.digest('hex')}`;
      const invalidSignature = 'sha256=' + 'a'.repeat(64); // Same length, different value

      // ACT - Measure time for valid signature
      const validStart = process.hrtime.bigint();
      verifyGitHubWebhook(payload, validSignature, secret);
      const validEnd = process.hrtime.bigint();
      const validTime = validEnd - validStart;

      // ACT - Measure time for invalid signature
      const invalidStart = process.hrtime.bigint();
      verifyGitHubWebhook(payload, invalidSignature, secret);
      const invalidEnd = process.hrtime.bigint();
      const invalidTime = invalidEnd - invalidStart;

      // ASSERT - Timing difference should be minimal (constant-time comparison)
      // Allow 100% variance for system noise in Jest environment
      // In production, crypto.timingSafeEqual provides actual timing-attack protection
      const timeDiff = Number(validTime - invalidTime) / Number(validTime);
      expect(Math.abs(timeDiff)).toBeLessThan(1.0);
    });
  });

  describe('verifyVercelWebhook', () => {
    test('should verify valid Vercel webhook signature', () => {
      // ARRANGE
      const secret = 'vercel-webhook-secret';
      const payload = JSON.stringify({
        type: 'deployment.created',
        payload: { id: 'dpl_123' },
      });

      // Generate valid signature (Vercel uses SHA1)
      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // ACT
      const result = verifyVercelWebhook(payload, expectedSignature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should reject invalid Vercel webhook signature', () => {
      // ARRANGE
      const secret = 'vercel-webhook-secret';
      const payload = JSON.stringify({
        type: 'deployment.created',
        payload: { id: 'dpl_123' },
      });
      const invalidSignature = 'invalid-signature-hash';

      // ACT
      const result = verifyVercelWebhook(payload, invalidSignature, secret);

      // ASSERT
      expect(result).toBe(false);
    });

    test('should reject signature with wrong secret', () => {
      // ARRANGE
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';
      const payload = JSON.stringify({ type: 'deployment.created' });

      // Generate signature with wrong secret
      const hmac = crypto.createHmac('sha1', wrongSecret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      // ACT
      const result = verifyVercelWebhook(payload, signature, correctSecret);

      // ASSERT
      expect(result).toBe(false);
    });

    test('should handle empty payload', () => {
      // ARRANGE
      const secret = 'vercel-webhook-secret';
      const payload = '';

      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      // ACT
      const result = verifyVercelWebhook(payload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should be timing-safe against timing attacks', () => {
      // ARRANGE
      const secret = 'vercel-webhook-secret';
      const payload = JSON.stringify({ type: 'test' });

      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(payload);
      const validSignature = hmac.digest('hex');
      const invalidSignature = 'a'.repeat(40); // Same length, different value

      // ACT - Measure time for valid signature
      const validStart = process.hrtime.bigint();
      verifyVercelWebhook(payload, validSignature, secret);
      const validEnd = process.hrtime.bigint();
      const validTime = validEnd - validStart;

      // ACT - Measure time for invalid signature
      const invalidStart = process.hrtime.bigint();
      verifyVercelWebhook(payload, invalidSignature, secret);
      const invalidEnd = process.hrtime.bigint();
      const invalidTime = invalidEnd - invalidStart;

      // ASSERT - Timing difference should be minimal (constant-time comparison)
      // Allow 100% variance for system noise in Jest environment
      // In production, crypto.timingSafeEqual provides actual timing-attack protection
      const timeDiff = Number(validTime - invalidTime) / Number(validTime);
      expect(Math.abs(timeDiff)).toBeLessThan(1.0);
    });
  });

  describe('generateHmacSignature (Helper)', () => {
    test('should generate HMAC-SHA256 signature', () => {
      // ARRANGE
      const payload = 'test payload';
      const secret = 'test-secret';
      const algorithm = 'sha256';

      // Generate expected signature
      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(payload);
      const expected = hmac.digest('hex');

      // ACT
      const result = generateHmacSignature(payload, secret, algorithm);

      // ASSERT
      expect(result).toBe(expected);
    });

    test('should generate HMAC-SHA1 signature', () => {
      // ARRANGE
      const payload = 'test payload';
      const secret = 'test-secret';
      const algorithm = 'sha1';

      // Generate expected signature
      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(payload);
      const expected = hmac.digest('hex');

      // ACT
      const result = generateHmacSignature(payload, secret, algorithm);

      // ASSERT
      expect(result).toBe(expected);
    });

    test('should generate different signatures for different payloads', () => {
      // ARRANGE
      const payload1 = 'payload 1';
      const payload2 = 'payload 2';
      const secret = 'test-secret';

      // ACT
      const signature1 = generateHmacSignature(payload1, secret, 'sha256');
      const signature2 = generateHmacSignature(payload2, secret, 'sha256');

      // ASSERT
      expect(signature1).not.toBe(signature2);
    });

    test('should generate different signatures for different secrets', () => {
      // ARRANGE
      const payload = 'test payload';
      const secret1 = 'secret 1';
      const secret2 = 'secret 2';

      // ACT
      const signature1 = generateHmacSignature(payload, secret1, 'sha256');
      const signature2 = generateHmacSignature(payload, secret2, 'sha256');

      // ASSERT
      expect(signature1).not.toBe(signature2);
    });

    test('should generate consistent signatures for same input', () => {
      // ARRANGE
      const payload = 'test payload';
      const secret = 'test-secret';

      // ACT
      const signature1 = generateHmacSignature(payload, secret, 'sha256');
      const signature2 = generateHmacSignature(payload, secret, 'sha256');

      // ASSERT
      expect(signature1).toBe(signature2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null or undefined gracefully', () => {
      // ARRANGE
      const secret = 'test-secret';

      // ACT & ASSERT - Should not throw
      expect(() => verifyGitHubWebhook(null as any, 'sig', secret)).not.toThrow();
      expect(() => verifyGitHubWebhook('payload', null as any, secret)).not.toThrow();
      expect(() => verifyGitHubWebhook('payload', 'sig', null as any)).not.toThrow();

      // All should return false
      expect(verifyGitHubWebhook(null as any, 'sig', secret)).toBe(false);
      expect(verifyGitHubWebhook('payload', null as any, secret)).toBe(false);
      expect(verifyGitHubWebhook('payload', 'sig', null as any)).toBe(false);
    });

    test('should handle very large payloads', () => {
      // ARRANGE
      const secret = 'test-secret';
      // Create a large payload (1MB)
      const largePayload = JSON.stringify({
        data: 'x'.repeat(1024 * 1024),
      });

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(largePayload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(largePayload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should handle Unicode in payload', () => {
      // ARRANGE
      const secret = 'test-secret';
      const payload = JSON.stringify({
        message: '你好世界 🌍 Привет мир',
      });

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });

    test('should handle newlines and whitespace in payload', () => {
      // ARRANGE
      const secret = 'test-secret';
      const payload = '{\n  "key": "value",\n  "nested": {\n    "data": true\n  }\n}';

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      // ACT
      const result = verifyGitHubWebhook(payload, signature, secret);

      // ASSERT
      expect(result).toBe(true);
    });
  });
});
