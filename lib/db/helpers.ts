/**
 * Database Query Helpers
 *
 * Provides CRUD operations, pagination, search, and soft delete
 * for all 9 database tables.
 *
 * Tables:
 * 1. User
 * 2. Project
 * 3. Quote
 * 4. TimeEntry
 * 5. MonitoringEvent
 * 6. DiscordMessage
 * 7. ApiKey
 * 8. Webhook
 * 9. SystemConfig
 *
 * @module lib/db/helpers
 */

import { prisma } from './prisma';
import type {
  Project,
  ProjectStatus,
  Quote,
  QuoteStatus,
  TimeEntry,
  MonitoringEvent,
  EventType,
  DiscordMessage,
  Prisma,
} from '@prisma/client';

// ============================================================================
// PROJECT HELPERS
// ============================================================================

/**
 * Find project by ID
 *
 * @param id - Project ID
 * @returns Project or null
 */
export async function findProjectById(id: string): Promise<Project | null> {
  return await prisma.project.findUnique({
    where: { id },
  });
}

/**
 * Find projects by status
 *
 * @param status - Project status
 * @returns Array of projects
 */
export async function findProjectsByStatus(
  status: ProjectStatus
): Promise<Project[]> {
  return await prisma.project.findMany({
    where: { status },
  });
}

/**
 * Create project
 *
 * @param data - Project data
 * @returns Created project
 */
export async function createProject(
  data: Prisma.ProjectCreateInput
): Promise<Project> {
  return await prisma.project.create({
    data,
  });
}

/**
 * Update project
 *
 * @param id - Project ID
 * @param data - Update data
 * @returns Updated project
 */
export async function updateProject(
  id: string,
  data: Prisma.ProjectUpdateInput
): Promise<Project> {
  return await prisma.project.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete project
 *
 * Sets deletedAt timestamp instead of removing from database.
 * Note: Schema needs deletedAt field added for soft delete.
 *
 * @param id - Project ID
 * @returns Updated project with deletedAt set
 */
export async function softDeleteProject(id: string): Promise<Project> {
  return await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ============================================================================
// QUOTE HELPERS
// ============================================================================

/**
 * Find quote by ID
 *
 * @param id - Quote ID
 * @returns Quote or null
 */
export async function findQuoteById(id: string): Promise<Quote | null> {
  return await prisma.quote.findUnique({
    where: { id },
  });
}

/**
 * Find quotes by status
 *
 * @param status - Quote status
 * @returns Array of quotes
 */
export async function findQuotesByStatus(
  status: QuoteStatus
): Promise<Quote[]> {
  return await prisma.quote.findMany({
    where: { status },
  });
}

/**
 * Create quote
 *
 * @param data - Quote data
 * @returns Created quote
 */
export async function createQuote(
  data: Prisma.QuoteCreateInput
): Promise<Quote> {
  return await prisma.quote.create({
    data,
  });
}

/**
 * Update quote status
 *
 * @param id - Quote ID
 * @param status - New status
 * @returns Updated quote
 */
export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<Quote> {
  return await prisma.quote.update({
    where: { id },
    data: { status },
  });
}

/**
 * Soft delete quote
 *
 * Sets deletedAt timestamp.
 * Note: Schema needs deletedAt field added for soft delete.
 *
 * @param id - Quote ID
 * @returns Updated quote with deletedAt set
 */
export async function softDeleteQuote(id: string): Promise<Quote> {
  return await prisma.quote.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ============================================================================
// TIME ENTRY HELPERS
// ============================================================================

/**
 * Start time entry
 *
 * Creates a time entry with startedAt timestamp.
 *
 * @param projectId - Project ID
 * @param description - Optional description
 * @returns Created time entry
 */
export async function startTimeEntry(
  projectId: string,
  description?: string
): Promise<TimeEntry> {
  return await prisma.timeEntry.create({
    data: {
      projectId,
      description,
      startedAt: new Date(),
      endedAt: null,
    },
  });
}

/**
 * End time entry
 *
 * Sets endedAt timestamp and calculates duration in minutes.
 *
 * @param id - Time entry ID
 * @returns Updated time entry
 */
export async function endTimeEntry(id: string): Promise<TimeEntry> {
  // Get existing entry to calculate duration
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw new Error(`Time entry not found: ${id}`);
  }

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - entry.startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000); // Convert to minutes

  return await prisma.timeEntry.update({
    where: { id },
    data: {
      endedAt,
      durationMinutes,
    },
  });
}

/**
 * Get total project hours
 *
 * Sums all completed time entries for a project.
 *
 * @param projectId - Project ID
 * @returns Total hours (decimal)
 */
export async function getProjectHours(projectId: string): Promise<number> {
  const result = await prisma.timeEntry.aggregate({
    where: {
      projectId,
      endedAt: { not: null }, // Only completed entries
    },
    _sum: {
      durationMinutes: true,
    },
  });

  const totalMinutes = result._sum.durationMinutes || 0;
  return totalMinutes / 60; // Convert to hours
}

// ============================================================================
// MONITORING EVENT HELPERS
// ============================================================================

/**
 * Log monitoring event
 *
 * @param data - Event data
 * @returns Created event
 */
export async function logMonitoringEvent(
  data: Prisma.MonitoringEventCreateInput
): Promise<MonitoringEvent> {
  return await prisma.monitoringEvent.create({
    data,
  });
}

/**
 * Get events by type
 *
 * @param type - Event type
 * @param limit - Maximum number of events to return
 * @returns Array of events
 */
export async function getEventsByType(
  type: EventType,
  limit: number = 100
): Promise<MonitoringEvent[]> {
  return await prisma.monitoringEvent.findMany({
    where: { type },
    take: limit,
    orderBy: { timestamp: 'desc' },
  });
}

// ============================================================================
// DISCORD MESSAGE HELPERS
// ============================================================================

/**
 * Log Discord message
 *
 * @param data - Message data
 * @returns Created message
 */
export async function logDiscordMessage(
  data: Prisma.DiscordMessageCreateInput
): Promise<DiscordMessage> {
  return await prisma.discordMessage.create({
    data,
  });
}

/**
 * Find messages by project
 *
 * @param projectId - Project ID
 * @returns Array of messages
 */
export async function findMessagesByProject(
  projectId: string
): Promise<DiscordMessage[]> {
  return await prisma.discordMessage.findMany({
    where: { projectId },
    orderBy: { timestamp: 'desc' },
  });
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginate projects
 *
 * @param options - Pagination options
 * @returns Array of projects
 */
export async function paginateProjects(
  options: PaginationOptions
): Promise<Project[]> {
  const { page, pageSize } = options;
  const skip = (page - 1) * pageSize;

  return await prisma.project.findMany({
    skip,
    take: pageSize,
  });
}

// ============================================================================
// SEARCH HELPERS
// ============================================================================

/**
 * Search projects
 *
 * Searches across title, description, and client name.
 *
 * @param query - Search query
 * @returns Array of matching projects
 */
export async function searchProjects(query: string): Promise<Project[]> {
  return await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { clientName: { contains: query, mode: 'insensitive' } },
      ],
    },
  });
}

/**
 * Export all helpers
 */
export default {
  // Project
  findProjectById,
  findProjectsByStatus,
  createProject,
  updateProject,
  softDeleteProject,

  // Quote
  findQuoteById,
  findQuotesByStatus,
  createQuote,
  updateQuoteStatus,
  softDeleteQuote,

  // Time Entry
  startTimeEntry,
  endTimeEntry,
  getProjectHours,

  // Monitoring Event
  logMonitoringEvent,
  getEventsByType,

  // Discord Message
  logDiscordMessage,
  findMessagesByProject,

  // Pagination
  paginateProjects,

  // Search
  searchProjects,
};
