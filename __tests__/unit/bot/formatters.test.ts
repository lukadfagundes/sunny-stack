/**
 * Unit Tests: Formatters
 *
 * Tests for bot/utils/formatters.ts
 */

import {
  formatCurrency,
  formatDuration,
  formatProjectStatus,
  formatQuoteStatus,
  truncateText,
  formatUserMention,
  formatChannelMention,
  formatCodeBlock,
  formatInlineCode,
  formatPercentage,
  formatBulletList,
  formatNumberedList,
} from '@/bot/utils/formatters';

describe('bot/utils/formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency with USD symbol', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(0.5)).toBe('$0.50');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h 0m');
    });

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h 0m');
      expect(formatDuration(180)).toBe('3h 0m');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('formatProjectStatus', () => {
    it('should format project statuses with icons', () => {
      expect(formatProjectStatus('PLANNING')).toBe('📋 Planning');
      expect(formatProjectStatus('IN_PROGRESS')).toBe('🚧 In Progress');
      expect(formatProjectStatus('REVIEW')).toBe('👀 Review');
      expect(formatProjectStatus('COMPLETE')).toBe('✅ Complete');
      expect(formatProjectStatus('ARCHIVED')).toBe('📦 Archived');
    });

    it('should handle unknown statuses', () => {
      expect(formatProjectStatus('UNKNOWN')).toBe('❓ Unknown');
    });
  });

  describe('formatQuoteStatus', () => {
    it('should format quote statuses with icons', () => {
      expect(formatQuoteStatus('PENDING')).toBe('⏳ Pending');
      expect(formatQuoteStatus('APPROVED')).toBe('✅ Approved');
      expect(formatQuoteStatus('DECLINED')).toBe('❌ Declined');
      expect(formatQuoteStatus('CONVERTED')).toBe('🔄 Converted');
    });

    it('should handle unknown statuses', () => {
      expect(formatQuoteStatus('UNKNOWN')).toBe('❓ Unknown');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'a'.repeat(150);
      expect(truncateText(longText, 100)).toBe('a'.repeat(97) + '...');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Short text', 100)).toBe('Short text');
    });

    it('should use default length of 100', () => {
      const text = 'a'.repeat(150);
      expect(truncateText(text)).toHaveLength(100);
    });
  });

  describe('formatUserMention', () => {
    it('should format user mention', () => {
      expect(formatUserMention('123456789')).toBe('<@123456789>');
    });
  });

  describe('formatChannelMention', () => {
    it('should format channel mention', () => {
      expect(formatChannelMention('987654321')).toBe('<#987654321>');
    });
  });

  describe('formatCodeBlock', () => {
    it('should format code block without language', () => {
      expect(formatCodeBlock('const x = 1;')).toBe('```\nconst x = 1;\n```');
    });

    it('should format code block with language', () => {
      expect(formatCodeBlock('const x = 1;', 'javascript')).toBe(
        '```javascript\nconst x = 1;\n```'
      );
    });
  });

  describe('formatInlineCode', () => {
    it('should format inline code', () => {
      expect(formatInlineCode('const x = 1;')).toBe('`const x = 1;`');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with one decimal', () => {
      expect(formatPercentage(0.75)).toBe('75.0%');
      expect(formatPercentage(0.333)).toBe('33.3%');
      expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatBulletList', () => {
    it('should format bullet list', () => {
      const items = ['First', 'Second', 'Third'];
      expect(formatBulletList(items)).toBe('• First\n• Second\n• Third');
    });

    it('should handle empty array', () => {
      expect(formatBulletList([])).toBe('');
    });
  });

  describe('formatNumberedList', () => {
    it('should format numbered list', () => {
      const items = ['First', 'Second', 'Third'];
      expect(formatNumberedList(items)).toBe('1. First\n2. Second\n3. Third');
    });

    it('should handle empty array', () => {
      expect(formatNumberedList([])).toBe('');
    });
  });
});
