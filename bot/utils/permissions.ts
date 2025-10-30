/**
 * Permission Validation Utilities
 *
 * Validates user permissions for commands
 *
 * @module bot/utils/permissions
 */

import type { PermissionLevel, BotConfig } from '../types';
import { botLogger } from '../core/logger';

/**
 * Validate user permission
 *
 * @param userId - Discord user ID
 * @param required - Required permission level
 * @param config - Bot configuration
 * @returns True if user has permission
 */
export function validatePermission(
  userId: string,
  required: PermissionLevel,
  config: BotConfig
): boolean {
  // Admin permission check
  if (required === 'admin') {
    const isAdmin = userId === config.adminUserId;

    if (!isAdmin) {
      botLogger.warn('Unauthorized command attempt', {
        userId,
        requiredPermission: required,
      });
    }

    return isAdmin;
  }

  // User permission (everyone)
  return true;
}

/**
 * Check if user is admin
 *
 * @param userId - Discord user ID
 * @param config - Bot configuration
 * @returns True if user is admin
 */
export function isAdmin(userId: string, config: BotConfig): boolean {
  return userId === config.adminUserId;
}

/**
 * Log unauthorized access attempt
 *
 * @param params - Access attempt details
 */
export function logUnauthorizedAccess(params: {
  userId: string;
  command: string;
  requiredPermission: PermissionLevel;
}): void {
  botLogger.warn('Unauthorized access attempt', params);
}
