/**
 * Embed Builder Utilities
 *
 * Pre-configured embed templates with Sunny Stack branding
 *
 * @module bot/utils/embed-builder
 */

import { EmbedBuilder } from 'discord.js';

/**
 * Sunny Stack brand colors
 */
export const COLORS = {
  PRIMARY: 0xf59e0b, // Amber-500 (Sunny Stack primary)
  SUCCESS: 0x10b981, // Green-500
  ERROR: 0xef4444, // Red-500
  WARNING: 0xf59e0b, // Amber-500
  INFO: 0x3b82f6, // Blue-500
  NEUTRAL: 0x6b7280, // Gray-500
};

/**
 * Create success embed
 *
 * @param title - Embed title
 * @param description - Embed description
 * @returns Configured EmbedBuilder
 */
export function createSuccessEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Create error embed
 *
 * @param title - Embed title
 * @param description - Embed description
 * @returns Configured EmbedBuilder
 */
export function createErrorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle(`❌ ${title}`)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Create warning embed
 *
 * @param title - Embed title
 * @param description - Embed description
 * @returns Configured EmbedBuilder
 */
export function createWarningEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle(`⚠️ ${title}`)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Create info embed
 *
 * @param title - Embed title
 * @param description - Embed description
 * @returns Configured EmbedBuilder
 */
export function createInfoEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`ℹ️ ${title}`)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Create project embed
 *
 * @param project - Project data
 * @returns Configured EmbedBuilder
 */
export function createProjectEmbed(project: {
  title: string;
  description?: string | null;
  status: string;
  budget?: number | null;
  deadline?: string | null;
  clientName: string;
  clientEmail: string;
}): EmbedBuilder {
  const statusColors: Record<string, number> = {
    PLANNING: COLORS.INFO,
    IN_PROGRESS: COLORS.PRIMARY,
    REVIEW: COLORS.WARNING,
    COMPLETE: COLORS.SUCCESS,
    ARCHIVED: COLORS.NEUTRAL,
  };

  const embed = new EmbedBuilder()
    .setColor(statusColors[project.status] || COLORS.PRIMARY)
    .setTitle(project.title)
    .setTimestamp();

  if (project.description) {
    embed.setDescription(project.description);
  }

  // Add fields
  embed.addFields(
    { name: 'Status', value: project.status.replace('_', ' '), inline: true },
    { name: 'Client', value: project.clientName, inline: true }
  );

  if (project.budget) {
    embed.addFields({
      name: 'Budget',
      value: `$${project.budget.toLocaleString()}`,
      inline: true,
    });
  }

  if (project.deadline) {
    embed.addFields({
      name: 'Deadline',
      value: new Date(project.deadline).toLocaleDateString(),
      inline: true,
    });
  }

  return embed;
}

/**
 * Create quote embed
 *
 * @param quote - Quote data
 * @returns Configured EmbedBuilder
 */
export function createQuoteEmbed(quote: {
  name: string;
  email: string;
  company?: string | null;
  projectType: string;
  description: string;
  status: string;
}): EmbedBuilder {
  const statusColors: Record<string, number> = {
    PENDING: COLORS.WARNING,
    APPROVED: COLORS.SUCCESS,
    DECLINED: COLORS.ERROR,
    CONVERTED: COLORS.INFO,
  };

  const embed = new EmbedBuilder()
    .setColor(statusColors[quote.status] || COLORS.PRIMARY)
    .setTitle(`Quote Request: ${quote.projectType}`)
    .setDescription(quote.description)
    .setTimestamp();

  embed.addFields(
    { name: 'Name', value: quote.name, inline: true },
    { name: 'Email', value: quote.email, inline: true },
    { name: 'Status', value: quote.status, inline: true }
  );

  if (quote.company) {
    embed.addFields({ name: 'Company', value: quote.company, inline: true });
  }

  return embed;
}

/**
 * Create monitoring alert embed
 *
 * @param alert - Alert data
 * @returns Configured EmbedBuilder
 */
export function createMonitoringEmbed(alert: {
  service: string;
  severity: string;
  message: string;
  timestamp: string;
}): EmbedBuilder {
  const severityColors: Record<string, number> = {
    INFO: COLORS.INFO,
    WARNING: COLORS.WARNING,
    ERROR: COLORS.ERROR,
    CRITICAL: COLORS.ERROR,
  };

  const severityEmojis: Record<string, string> = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    ERROR: '❌',
    CRITICAL: '🚨',
  };

  const emoji = severityEmojis[alert.severity] || 'ℹ️';
  const color = severityColors[alert.severity] || COLORS.INFO;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${alert.service} Alert`)
    .setDescription(alert.message)
    .addFields(
      { name: 'Severity', value: alert.severity, inline: true },
      { name: 'Service', value: alert.service, inline: true }
    )
    .setTimestamp(new Date(alert.timestamp));

  return embed;
}

/**
 * Create list embed with pagination footer
 *
 * @param title - Embed title
 * @param items - Array of items
 * @param page - Current page
 * @param totalPages - Total pages
 * @returns Configured EmbedBuilder
 */
export function createListEmbed(
  title: string,
  items: string[],
  page: number,
  totalPages: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(title)
    .setDescription(items.join('\n'))
    .setFooter({ text: `Page ${page} of ${totalPages}` })
    .setTimestamp();

  return embed;
}
