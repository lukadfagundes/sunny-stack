/**
 * Message Formatting Utilities
 *
 * Consistent formatting for common data types
 *
 * @module bot/utils/formatters
 */

/**
 * Format currency amount
 *
 * @param amount - Amount in dollars
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format date as relative time (e.g., "2 days ago")
 *
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format duration in minutes to human-readable string
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Format project status with emoji
 *
 * @param status - Project status
 * @returns Formatted status string with emoji
 */
export function formatProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PLANNING: '📋 Planning',
    IN_PROGRESS: '🚧 In Progress',
    REVIEW: '👀 Review',
    COMPLETE: '✅ Complete',
    ARCHIVED: '📦 Archived',
  };

  return statusMap[status] || '❓ Unknown';
}

/**
 * Format quote status with emoji
 *
 * @param status - Quote status
 * @returns Formatted status string with emoji
 */
export function formatQuoteStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: '⏳ Pending',
    APPROVED: '✅ Approved',
    DECLINED: '❌ Declined',
    CONVERTED: '🔄 Converted',
  };

  return statusMap[status] || '❓ Unknown';
}

/**
 * Truncate text to max length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format Discord user mention
 *
 * @param userId - Discord user ID
 * @returns User mention string
 */
export function formatUserMention(userId: string): string {
  return `<@${userId}>`;
}

/**
 * Format Discord channel mention
 *
 * @param channelId - Discord channel ID
 * @returns Channel mention string
 */
export function formatChannelMention(channelId: string): string {
  return `<#${channelId}>`;
}

/**
 * Format Discord role mention
 *
 * @param roleId - Discord role ID
 * @returns Role mention string
 */
export function formatRoleMention(roleId: string): string {
  return `<@&${roleId}>`;
}

/**
 * Format timestamp for Discord (shows relative time in Discord UI)
 *
 * @param date - Date to format
 * @param style - Discord timestamp style (default: 'R' for relative)
 * @returns Discord timestamp string
 */
export function formatDiscordTimestamp(
  date: Date | string,
  style: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 'R'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timestamp = Math.floor(dateObj.getTime() / 1000);

  return `<t:${timestamp}:${style}>`;
}

/**
 * Format code block
 *
 * @param code - Code content
 * @param language - Language for syntax highlighting
 * @returns Formatted code block
 */
export function formatCodeBlock(code: string, language = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Format inline code
 *
 * @param code - Code content
 * @returns Formatted inline code
 */
export function formatInlineCode(code: string): string {
  return `\`${code}\``;
}

/**
 * Format percentage
 *
 * @param value - Percentage value (0-1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format list items as bullet points
 *
 * @param items - Array of items
 * @returns Formatted bullet list
 */
export function formatBulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

/**
 * Format numbered list
 *
 * @param items - Array of items
 * @returns Formatted numbered list
 */
export function formatNumberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}
