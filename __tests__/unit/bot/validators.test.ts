/**
 * Unit Tests: Bot Validators
 *
 * Tests for bot/core/validators.ts
 */

import {
  validateEmail,
  validateTitle,
  validateBudget,
  validateDate,
  validateDescription,
  validateDuration,
  validateId,
  sanitizeInput,
  validatePagination,
} from '@/bot/core/validators';
import { ValidationError } from '@/bot/core/errors';

describe('bot/core/validators', () => {
  describe('validateEmail', () => {
    it('should validate and normalize valid emails', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
      expect(validateEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
      expect(validateEmail('user+tag@example.co.uk')).toBe('user+tag@example.co.uk');
    });

    it('should reject invalid emails', () => {
      expect(() => validateEmail('')).toThrow(ValidationError);
      expect(() => validateEmail('notanemail')).toThrow(ValidationError);
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
      expect(() => validateEmail('user@')).toThrow(ValidationError);
    });

    it('should reject emails longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => validateEmail(longEmail)).toThrow(ValidationError);
    });
  });

  describe('validateTitle', () => {
    it('should validate and trim valid titles', () => {
      expect(validateTitle('Valid Title')).toBe('Valid Title');
      expect(validateTitle('  Trimmed  ')).toBe('Trimmed');
    });

    it('should reject empty or whitespace-only titles', () => {
      expect(() => validateTitle('')).toThrow(ValidationError);
      expect(() => validateTitle('   ')).toThrow(ValidationError);
    });

    it('should reject titles longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => validateTitle(longTitle)).toThrow(ValidationError);
    });

    it('should accept titles up to 200 characters', () => {
      const maxTitle = 'a'.repeat(200);
      expect(validateTitle(maxTitle)).toBe(maxTitle);
    });
  });

  describe('validateBudget', () => {
    it('should validate and parse valid budget amounts', () => {
      expect(validateBudget('1000')).toBe(1000);
      expect(validateBudget('1000.50')).toBe(1000.5);
      expect(validateBudget('0.01')).toBe(0.01);
    });

    it('should reject negative budgets', () => {
      expect(() => validateBudget('-100')).toThrow(ValidationError);
    });

    it('should reject zero budgets', () => {
      expect(() => validateBudget('0')).toThrow(ValidationError);
    });

    it('should reject budgets over $10M', () => {
      expect(() => validateBudget('10000001')).toThrow(ValidationError);
    });

    it('should reject invalid number formats', () => {
      expect(() => validateBudget('not a number')).toThrow(ValidationError);
      expect(() => validateBudget('')).toThrow(ValidationError);
    });

    it('should accept budgets up to $10M', () => {
      expect(validateBudget('10000000')).toBe(10000000);
    });
  });

  describe('validateDate', () => {
    it('should validate and parse valid ISO dates', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // Tomorrow
      const result = validateDate(futureDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject past dates', () => {
      const pastDate = '2020-01-01';
      expect(() => validateDate(pastDate)).toThrow(ValidationError);
    });

    it('should reject invalid date formats', () => {
      expect(() => validateDate('not a date')).toThrow(ValidationError);
      expect(() => validateDate('01/01/2025')).toThrow(ValidationError);
    });

    it('should reject empty dates', () => {
      expect(() => validateDate('')).toThrow(ValidationError);
    });
  });

  describe('validateDescription', () => {
    it('should validate and trim valid descriptions', () => {
      expect(validateDescription('Valid description', false)).toBe('Valid description');
      expect(validateDescription('  Trimmed  ', false)).toBe('Trimmed');
    });

    it('should allow null when not required', () => {
      expect(validateDescription(null, false)).toBeNull();
      expect(validateDescription('', false)).toBeNull();
      expect(validateDescription('   ', false)).toBeNull();
    });

    it('should reject null when required', () => {
      expect(() => validateDescription(null, true)).toThrow(ValidationError);
      expect(() => validateDescription('', true)).toThrow(ValidationError);
    });

    it('should reject descriptions longer than 5000 characters', () => {
      const longDesc = 'a'.repeat(5001);
      expect(() => validateDescription(longDesc, false)).toThrow(ValidationError);
    });

    it('should accept descriptions up to 5000 characters', () => {
      const maxDesc = 'a'.repeat(5000);
      expect(validateDescription(maxDesc, false)).toBe(maxDesc);
    });
  });

  describe('validateDuration', () => {
    it('should validate and parse valid durations', () => {
      expect(validateDuration('60')).toBe(60);
      expect(validateDuration('1')).toBe(1);
      expect(validateDuration('1440')).toBe(1440);
      expect(validateDuration(120)).toBe(120);
    });

    it('should reject durations less than 1 minute', () => {
      expect(() => validateDuration('0')).toThrow(ValidationError);
      expect(() => validateDuration('-10')).toThrow(ValidationError);
    });

    it('should reject durations over 1440 minutes (24 hours)', () => {
      expect(() => validateDuration('1441')).toThrow(ValidationError);
      expect(() => validateDuration('10000')).toThrow(ValidationError);
    });

    it('should reject invalid number formats', () => {
      expect(() => validateDuration('not a number')).toThrow(ValidationError);
    });
  });

  describe('validateId', () => {
    it('should validate valid CUID-like IDs', () => {
      const validId = 'clabcd1234567890';
      expect(validateId(validId)).toBe(validId);
    });

    it('should trim whitespace', () => {
      const id = '  clabcd1234567890  ';
      expect(validateId(id)).toBe('clabcd1234567890');
    });

    it('should reject empty IDs', () => {
      expect(() => validateId('')).toThrow(ValidationError);
      expect(() => validateId('   ')).toThrow(ValidationError);
    });

    it('should reject IDs with invalid characters', () => {
      expect(() => validateId('invalid@id')).toThrow(ValidationError);
      expect(() => validateId('id with spaces')).toThrow(ValidationError);
    });

    it('should reject IDs longer than 50 characters', () => {
      const longId = 'a'.repeat(51);
      expect(() => validateId(longId)).toThrow(ValidationError);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove null bytes', () => {
      expect(sanitizeInput('test\0data')).toBe('testdata');
    });

    it('should remove control characters', () => {
      expect(sanitizeInput('test\x00\x01\x02data')).toBe('testdata');
    });

    it('should preserve normal text', () => {
      expect(sanitizeInput('Normal text with 123 and symbols!@#')).toBe(
        'Normal text with 123 and symbols!@#'
      );
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeInput('Line 1\nLine 2\tTabbed')).toBe('Line 1\nLine 2\tTabbed');
    });
  });

  describe('validatePagination', () => {
    it('should use default values when not provided', () => {
      expect(validatePagination({})).toEqual({ page: 1, limit: 10 });
    });

    it('should validate valid pagination values', () => {
      expect(validatePagination({ page: 5, limit: 20 })).toEqual({ page: 5, limit: 20 });
    });

    it('should reject page less than 1', () => {
      expect(() => validatePagination({ page: 0 })).toThrow(ValidationError);
      expect(() => validatePagination({ page: -1 })).toThrow(ValidationError);
    });

    it('should reject limit less than 1', () => {
      expect(() => validatePagination({ limit: 0 })).toThrow(ValidationError);
    });

    it('should reject limit over 100', () => {
      expect(() => validatePagination({ limit: 101 })).toThrow(ValidationError);
    });

    it('should accept limit up to 100', () => {
      expect(validatePagination({ limit: 100 })).toEqual({ page: 1, limit: 100 });
    });
  });
});
