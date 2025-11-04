/**
 * Input Validation Functions
 *
 * Validates user input from Discord commands
 *
 * @module bot/core/validators
 */

import { ValidationError } from './errors';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address
 *
 * @param email - Email address to validate
 * @returns Validated email (lowercase)
 * @throws {ValidationError} If email is invalid
 */
export function validateEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email');
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > 254) {
    throw new ValidationError('Email must be 254 characters or less', 'email');
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  return trimmed;
}

/**
 * Validate project title
 *
 * @param title - Project title to validate
 * @returns Validated title
 * @throws {ValidationError} If title is invalid
 */
export function validateTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Title is required', 'title');
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Title cannot be empty', 'title');
  }

  if (trimmed.length > 200) {
    throw new ValidationError('Title must be 200 characters or less', 'title');
  }

  return trimmed;
}

/**
 * Validate budget amount
 *
 * @param budget - Budget amount to validate (as string)
 * @returns Validated budget as number
 * @throws {ValidationError} If budget is invalid
 */
export function validateBudget(budget: string): number {
  if (!budget || typeof budget !== 'string') {
    throw new ValidationError('Budget is required', 'budget');
  }

  const budgetNum = parseFloat(budget);

  if (isNaN(budgetNum)) {
    throw new ValidationError('Budget must be a valid number', 'budget');
  }

  if (budgetNum <= 0) {
    throw new ValidationError('Budget must be greater than zero', 'budget');
  }

  if (budgetNum > 10000000) {
    throw new ValidationError('Budget cannot exceed $10,000,000', 'budget');
  }

  return budgetNum;
}

/**
 * Validate date string
 *
 * @param date - Date string to validate (DD-MM-YYYY format)
 * @returns Validated Date object
 * @throws {ValidationError} If date is invalid
 */
export function validateDate(date: string): Date {
  if (!date || typeof date !== 'string') {
    throw new ValidationError('Date is required', 'date');
  }

  const trimmed = date.trim();

  // Parse DD-MM-YYYY format
  const parts = trimmed.split('-');
  if (parts.length !== 3) {
    throw new ValidationError('Invalid date format. Use DD-MM-YYYY', 'date');
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new ValidationError('Invalid date format. Use DD-MM-YYYY', 'date');
  }

  // Validate ranges
  if (day < 1 || day > 31) {
    throw new ValidationError('Day must be between 1 and 31', 'date');
  }
  if (month < 1 || month > 12) {
    throw new ValidationError('Month must be between 1 and 12', 'date');
  }
  if (year < 2000 || year > 2100) {
    throw new ValidationError('Year must be between 2000 and 2100', 'date');
  }

  // Create date object (month is 0-indexed in JavaScript Date)
  const parsed = new Date(year, month - 1, day);

  // Validate that the date is valid (e.g., no 31st of February)
  if (
    parsed.getDate() !== day ||
    parsed.getMonth() !== month - 1 ||
    parsed.getFullYear() !== year
  ) {
    throw new ValidationError('Invalid date (day does not exist in month)', 'date');
  }

  // Check if date is in the past (for deadlines)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (parsed < now) {
    throw new ValidationError('Date cannot be in the past', 'date');
  }

  return parsed;
}

/**
 * Validate description text
 *
 * @param description - Description to validate
 * @param required - Whether description is required
 * @returns Validated description or null
 * @throws {ValidationError} If description is invalid
 */
export function validateDescription(
  description: string | null | undefined,
  required = false
): string | null {
  if (!description || description.trim() === '') {
    if (required) {
      throw new ValidationError('Description is required', 'description');
    }
    return null;
  }

  const trimmed = description.trim();

  if (trimmed.length > 5000) {
    throw new ValidationError(
      'Description must be 5000 characters or less',
      'description'
    );
  }

  return trimmed;
}

/**
 * Validate duration in minutes
 *
 * @param minutes - Duration in minutes (as string or number)
 * @returns Validated duration as number
 * @throws {ValidationError} If duration is invalid
 */
export function validateDuration(minutes: string | number): number {
  const durationNum =
    typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;

  if (isNaN(durationNum)) {
    throw new ValidationError(
      'Duration must be a valid number of minutes',
      'duration'
    );
  }

  if (durationNum <= 0) {
    throw new ValidationError('Duration must be greater than 0', 'duration');
  }

  if (durationNum > 1440) {
    // 24 hours
    throw new ValidationError('Duration cannot exceed 24 hours (1440 minutes)', 'duration');
  }

  return durationNum;
}

/**
 * Validate project ID (CUID format)
 *
 * @param id - Project/Quote/Entity ID
 * @returns Validated ID
 * @throws {ValidationError} If ID is invalid
 */
export function validateId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('ID is required', 'id');
  }

  const trimmed = id.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('ID cannot be empty', 'id');
  }

  // CUID format validation (starts with 'c' or 'cl', alphanumeric)
  if (!trimmed.match(/^c[a-z0-9]+$/)) {
    throw new ValidationError('Invalid ID format', 'id');
  }

  return trimmed;
}

/**
 * Sanitize user input (prevent injection attacks)
 *
 * @param input - User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate pagination parameters
 *
 * @param params - Pagination params
 * @returns Validated pagination params
 */
export function validatePagination(params: {
  page?: string | number;
  limit?: string | number;
}): { page: number; limit: number } {
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : (params.page ?? 1);
  const limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : (params.limit ?? 10);

  if (isNaN(page) || page < 1) {
    throw new ValidationError('Page must be a positive integer', 'page');
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100', 'limit');
  }

  return { page, limit };
}
