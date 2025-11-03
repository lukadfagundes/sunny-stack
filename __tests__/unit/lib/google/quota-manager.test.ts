/**
 * @jest-environment node
 */

// __tests__/unit/lib/google/quota-manager.test.ts

/**
 * Test suite for GoogleQuotaManager
 * Tests quota tracking, rate limiting, and auto-reset functionality
 */

import { GoogleQuotaManager, GOOGLE_QUOTA_LIMITS } from '@/lib/google/quota-manager';

describe('GoogleQuotaManager', () => {
  let quotaManager: GoogleQuotaManager;

  beforeEach(() => {
    quotaManager = new GoogleQuotaManager();
  });

  describe('Quota Tracking', () => {
    test('should track API usage for a service', () => {
      quotaManager.track('gmail', 10);

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsage).toBe(10);
      expect(usage.dayUsage).toBe(10);
    });

    test('should accumulate multiple requests', () => {
      quotaManager.track('gmail', 5);
      quotaManager.track('gmail', 10);
      quotaManager.track('gmail', 15);

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsage).toBe(30);
      expect(usage.dayUsage).toBe(30);
    });

    test('should track different services independently', () => {
      quotaManager.track('gmail', 10);
      quotaManager.track('drive', 20);
      quotaManager.track('calendar', 30);

      expect(quotaManager.getUsage('gmail').minuteUsage).toBe(10);
      expect(quotaManager.getUsage('drive').minuteUsage).toBe(20);
      expect(quotaManager.getUsage('calendar').minuteUsage).toBe(30);
    });

    test('should return zero usage for untracked services', () => {
      const usage = quotaManager.getUsage('sheets');

      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(0);
      expect(usage.perMinuteLimit).toBe(GOOGLE_QUOTA_LIMITS.sheets.perMinute);
      expect(usage.perDayLimit).toBe(GOOGLE_QUOTA_LIMITS.sheets.perDay);
    });
  });

  describe('Quota Limits', () => {
    test('should have correct limits for Gmail', () => {
      const usage = quotaManager.getUsage('gmail');
      expect(usage.perMinuteLimit).toBe(250);
      expect(usage.perDayLimit).toBe(1_000_000);
    });

    test('should have correct limits for Drive', () => {
      const usage = quotaManager.getUsage('drive');
      expect(usage.perMinuteLimit).toBe(1000);
      expect(usage.perDayLimit).toBe(10_000_000);
    });

    test('should have correct limits for Calendar', () => {
      const usage = quotaManager.getUsage('calendar');
      expect(usage.perMinuteLimit).toBe(600);
      expect(usage.perDayLimit).toBe(1_000_000);
    });

    test('should have correct limits for Sheets', () => {
      const usage = quotaManager.getUsage('sheets');
      expect(usage.perMinuteLimit).toBe(100);
      expect(usage.perDayLimit).toBe(500_000);
    });

    test('should have correct limits for Docs', () => {
      const usage = quotaManager.getUsage('docs');
      expect(usage.perMinuteLimit).toBe(100);
      expect(usage.perDayLimit).toBe(500_000);
    });

    test('should have correct limits for Tasks', () => {
      const usage = quotaManager.getUsage('tasks');
      expect(usage.perMinuteLimit).toBe(100);
      expect(usage.perDayLimit).toBe(50_000);
    });

    test('should have correct limits for Contacts', () => {
      const usage = quotaManager.getUsage('contacts');
      expect(usage.perMinuteLimit).toBe(60);
      expect(usage.perDayLimit).toBe(10_000);
    });
  });

  describe('Request Permission Check', () => {
    test('should allow request when under quota', () => {
      quotaManager.track('gmail', 100);

      expect(quotaManager.canMakeRequest('gmail', 50)).toBe(true);
    });

    test('should deny request when exceeding per-minute quota', () => {
      quotaManager.track('gmail', 240);

      expect(quotaManager.canMakeRequest('gmail', 20)).toBe(false);
    });

    test('should deny request when exceeding per-day quota', () => {
      quotaManager.track('gmail', 999_990);

      expect(quotaManager.canMakeRequest('gmail', 20)).toBe(false);
    });

    test('should allow request exactly at quota limit', () => {
      quotaManager.track('gmail', 249);

      expect(quotaManager.canMakeRequest('gmail', 1)).toBe(true);
    });

    test('should deny request that would exceed limit', () => {
      quotaManager.track('gmail', 240);

      expect(quotaManager.canMakeRequest('gmail', 11)).toBe(false);
    });
  });

  describe('Warning Thresholds', () => {
    test('should return warning status at 80% of per-minute limit', () => {
      quotaManager.track('gmail', 200); // 80% of 250

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteWarning).toBe(true);
      expect(usage.minuteExceeded).toBe(false);
    });

    test('should return exceeded status at 100% of per-minute limit', () => {
      quotaManager.track('gmail', 250); // 100% of 250

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteWarning).toBe(true);
      expect(usage.minuteExceeded).toBe(true);
    });

    test('should return warning status at 80% of per-day limit', () => {
      quotaManager.track('gmail', 800_000); // 80% of 1,000,000

      const usage = quotaManager.getUsage('gmail');
      expect(usage.dayWarning).toBe(true);
      expect(usage.dayExceeded).toBe(false);
    });

    test('should return exceeded status at 100% of per-day limit', () => {
      quotaManager.track('gmail', 1_000_000); // 100% of 1,000,000

      const usage = quotaManager.getUsage('gmail');
      expect(usage.dayWarning).toBe(true);
      expect(usage.dayExceeded).toBe(true);
    });
  });

  describe('Auto-Reset Logic', () => {
    test('should reset minutely counters', () => {
      quotaManager.track('gmail', 100);

      quotaManager.resetMinutely();

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(100); // Day counter should NOT reset
    });

    test('should reset daily counters', () => {
      quotaManager.track('gmail', 100);

      quotaManager.resetDaily();

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsage).toBe(100); // Minute counter should NOT reset
      expect(usage.dayUsage).toBe(0);
    });

    test('should reset all services on minutely reset', () => {
      quotaManager.track('gmail', 50);
      quotaManager.track('drive', 100);
      quotaManager.track('calendar', 150);

      quotaManager.resetMinutely();

      expect(quotaManager.getUsage('gmail').minuteUsage).toBe(0);
      expect(quotaManager.getUsage('drive').minuteUsage).toBe(0);
      expect(quotaManager.getUsage('calendar').minuteUsage).toBe(0);
    });

    test('should reset all services on daily reset', () => {
      quotaManager.track('gmail', 1000);
      quotaManager.track('drive', 2000);

      quotaManager.resetDaily();

      expect(quotaManager.getUsage('gmail').dayUsage).toBe(0);
      expect(quotaManager.getUsage('drive').dayUsage).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero cost tracking', () => {
      quotaManager.track('gmail', 0);

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsage).toBe(0);
      expect(usage.dayUsage).toBe(0);
    });

    test('should handle negative cost (should be ignored or throw)', () => {
      expect(() => {
        quotaManager.track('gmail', -10);
      }).toThrow();
    });

    test('should handle unknown service gracefully', () => {
      expect(() => {
        quotaManager.track('unknown_service', 10);
      }).toThrow();
    });

    test('should handle very large quota requests', () => {
      expect(quotaManager.canMakeRequest('gmail', 1_000_000_000)).toBe(false);
    });
  });

  describe('Quota Usage Percentage', () => {
    test('should calculate minute usage percentage correctly', () => {
      quotaManager.track('gmail', 125); // 50% of 250

      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsagePercent).toBe(50);
    });

    test('should calculate day usage percentage correctly', () => {
      quotaManager.track('gmail', 500_000); // 50% of 1,000,000

      const usage = quotaManager.getUsage('gmail');
      expect(usage.dayUsagePercent).toBe(50);
    });

    test('should handle 0% usage', () => {
      const usage = quotaManager.getUsage('gmail');
      expect(usage.minuteUsagePercent).toBe(0);
      expect(usage.dayUsagePercent).toBe(0);
    });

    test('should handle 100% usage', () => {
      // Track 100% of minute quota
      quotaManager.track('gmail', 250);
      const minuteUsage = quotaManager.getUsage('gmail');
      expect(minuteUsage.minuteUsagePercent).toBe(100);

      // Reset and track 100% of day quota (in multiple calls to avoid exceeding minute quota)
      quotaManager.resetMinutely();
      for (let i = 0; i < 4000; i++) {
        quotaManager.track('gmail', 250); // 4000 * 250 = 1,000,000
        quotaManager.resetMinutely(); // Reset minute quota each time
      }

      const dayUsage = quotaManager.getUsage('gmail');
      expect(dayUsage.dayUsagePercent).toBe(100);
    });
  });
});
