/**
 * @file Common DataLoaders for database entities
 * @description Pre-configured DataLoader instances for efficient batch loading
 * @module lib/db/loaders
 *
 * Usage Example:
 * ```typescript
 * import { createProjectLoader, createQuotesByProjectLoader } from '@/lib/db/loaders';
 *
 * const projectLoader = createProjectLoader(prisma);
 * const quotesByProjectLoader = createQuotesByProjectLoader(prisma);
 *
 * // Load a project and its quotes (only 2 queries total)
 * const project = await projectLoader.load('project-123');
 * const quotes = await quotesByProjectLoader.load('project-123');
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { DataLoader } from '@/lib/db/batch-loader';
import { logger } from '@/lib/logger';
import type {
  Project,
  Quote,
  TimeEntry,
  User,
  Proposal,
  MonitoringEvent,
  DiscordMessage,
} from '@prisma/client';

/**
 * Create a DataLoader for loading Projects by ID
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for Project entities
 *
 * @example
 * const projectLoader = createProjectLoader(prisma);
 * const projects = await Promise.all([
 *   projectLoader.load('id1'),
 *   projectLoader.load('id2'),
 *   projectLoader.load('id3'),
 * ]);
 * // Only 1 database query executed
 */
export function createProjectLoader(
  prisma: PrismaClient
): DataLoader<string, Project | null> {
  return new DataLoader<string, Project | null>(
    async (projectIds) => {
      logger.debug('ProjectLoader: Batch loading projects', {
        count: projectIds.length,
      });

      const projects = await prisma.project.findMany({
        where: {
          id: { in: [...projectIds] },
          deletedAt: null, // Exclude soft-deleted projects
        },
      });

      // Create a map for O(1) lookup
      const projectMap = new Map(projects.map((p) => [p.id, p]));

      // Return results in same order as input keys
      return projectIds.map((id) => projectMap.get(id) ?? null);
    },
    { name: 'ProjectLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Quotes by ID
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for Quote entities
 *
 * @example
 * const quoteLoader = createQuoteLoader(prisma);
 * const quote = await quoteLoader.load('quote-123');
 */
export function createQuoteLoader(
  prisma: PrismaClient
): DataLoader<string, Quote | null> {
  return new DataLoader<string, Quote | null>(
    async (quoteIds) => {
      logger.debug('QuoteLoader: Batch loading quotes', {
        count: quoteIds.length,
      });

      const quotes = await prisma.quote.findMany({
        where: {
          id: { in: [...quoteIds] },
          deletedAt: null, // Exclude soft-deleted quotes
        },
      });

      const quoteMap = new Map(quotes.map((q) => [q.id, q]));
      return quoteIds.map((id) => quoteMap.get(id) ?? null);
    },
    { name: 'QuoteLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Quotes by Project ID (one-to-many)
 *
 * Returns all quotes for a given project.
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for Quote[] by project ID
 *
 * @example
 * const quotesByProjectLoader = createQuotesByProjectLoader(prisma);
 * const quotes = await quotesByProjectLoader.load('project-123');
 */
export function createQuotesByProjectLoader(
  prisma: PrismaClient
): DataLoader<string, Quote[]> {
  return new DataLoader<string, Quote[]>(
    async (projectIds) => {
      logger.debug('QuotesByProjectLoader: Batch loading quotes by project', {
        count: projectIds.length,
      });

      const quotes = await prisma.quote.findMany({
        where: {
          projectId: { in: [...projectIds] },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group quotes by project ID
      const quotesByProject = new Map<string, Quote[]>();
      projectIds.forEach((id) => quotesByProject.set(id, []));

      quotes.forEach((quote) => {
        if (quote.projectId) {
          const projectQuotes = quotesByProject.get(quote.projectId) ?? [];
          projectQuotes.push(quote);
          quotesByProject.set(quote.projectId, projectQuotes);
        }
      });

      return projectIds.map((id) => quotesByProject.get(id) ?? []);
    },
    { name: 'QuotesByProjectLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Time Entries by Project ID
 *
 * Returns all time entries for a given project.
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for TimeEntry[] by project ID
 *
 * @example
 * const timeEntriesLoader = createTimeEntriesByProjectLoader(prisma);
 * const entries = await timeEntriesLoader.load('project-123');
 */
export function createTimeEntriesByProjectLoader(
  prisma: PrismaClient
): DataLoader<string, TimeEntry[]> {
  return new DataLoader<string, TimeEntry[]>(
    async (projectIds) => {
      logger.debug(
        'TimeEntriesByProjectLoader: Batch loading time entries by project',
        { count: projectIds.length }
      );

      const entries = await prisma.timeEntry.findMany({
        where: {
          projectId: { in: [...projectIds] },
        },
        orderBy: { startedAt: 'desc' },
      });

      // Group time entries by project ID
      const entriesByProject = new Map<string, TimeEntry[]>();
      projectIds.forEach((id) => entriesByProject.set(id, []));

      entries.forEach((entry) => {
        const projectEntries = entriesByProject.get(entry.projectId) ?? [];
        projectEntries.push(entry);
        entriesByProject.set(entry.projectId, projectEntries);
      });

      return projectIds.map((id) => entriesByProject.get(id) ?? []);
    },
    { name: 'TimeEntriesByProjectLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Active Time Entry by Project ID
 *
 * Returns the currently active (endedAt is null) time entry for a project.
 * Only one active time entry should exist per project.
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for active TimeEntry by project ID
 *
 * @example
 * const activeTimeEntryLoader = createActiveTimeEntryLoader(prisma);
 * const activeEntry = await activeTimeEntryLoader.load('project-123');
 * if (activeEntry) {
 *   console.log('Time tracking is active for this project');
 * }
 */
export function createActiveTimeEntryLoader(
  prisma: PrismaClient
): DataLoader<string, TimeEntry | null> {
  return new DataLoader<string, TimeEntry | null>(
    async (projectIds) => {
      logger.debug(
        'ActiveTimeEntryLoader: Batch loading active time entries by project',
        { count: projectIds.length }
      );

      const entries = await prisma.timeEntry.findMany({
        where: {
          projectId: { in: [...projectIds] },
          endedAt: null, // Active entries only
        },
        orderBy: { startedAt: 'desc' },
      });

      // Map project ID to active entry
      const activeEntryMap = new Map<string, TimeEntry>();
      entries.forEach((entry) => {
        // Only set if not already set (take most recent)
        if (!activeEntryMap.has(entry.projectId)) {
          activeEntryMap.set(entry.projectId, entry);
        }
      });

      return projectIds.map((id) => activeEntryMap.get(id) ?? null);
    },
    { name: 'ActiveTimeEntryLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Users by ID
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for User entities
 *
 * @example
 * const userLoader = createUserLoader(prisma);
 * const user = await userLoader.load('user-123');
 */
export function createUserLoader(
  prisma: PrismaClient
): DataLoader<string, User | null> {
  return new DataLoader<string, User | null>(
    async (userIds) => {
      logger.debug('UserLoader: Batch loading users', {
        count: userIds.length,
      });

      const users = await prisma.user.findMany({
        where: {
          id: { in: [...userIds] },
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      return userIds.map((id) => userMap.get(id) ?? null);
    },
    { name: 'UserLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Proposals by Quote ID
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for Proposal[] by quote ID
 *
 * @example
 * const proposalsByQuoteLoader = createProposalsByQuoteLoader(prisma);
 * const proposals = await proposalsByQuoteLoader.load('quote-123');
 */
export function createProposalsByQuoteLoader(
  prisma: PrismaClient
): DataLoader<string, Proposal[]> {
  return new DataLoader<string, Proposal[]>(
    async (quoteIds) => {
      logger.debug(
        'ProposalsByQuoteLoader: Batch loading proposals by quote',
        { count: quoteIds.length }
      );

      const proposals = await prisma.proposal.findMany({
        where: {
          quoteId: { in: [...quoteIds] },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group proposals by quote ID
      const proposalsByQuote = new Map<string, Proposal[]>();
      quoteIds.forEach((id) => proposalsByQuote.set(id, []));

      proposals.forEach((proposal) => {
        const quoteProposals = proposalsByQuote.get(proposal.quoteId) ?? [];
        quoteProposals.push(proposal);
        proposalsByQuote.set(proposal.quoteId, quoteProposals);
      });

      return quoteIds.map((id) => proposalsByQuote.get(id) ?? []);
    },
    { name: 'ProposalsByQuoteLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Discord Messages by Project ID
 *
 * @param prisma - Prisma client instance
 * @returns DataLoader for DiscordMessage[] by project ID
 *
 * @example
 * const discordMessagesByProjectLoader = createDiscordMessagesByProjectLoader(prisma);
 * const messages = await discordMessagesByProjectLoader.load('project-123');
 */
export function createDiscordMessagesByProjectLoader(
  prisma: PrismaClient
): DataLoader<string, DiscordMessage[]> {
  return new DataLoader<string, DiscordMessage[]>(
    async (projectIds) => {
      logger.debug(
        'DiscordMessagesByProjectLoader: Batch loading discord messages by project',
        { count: projectIds.length }
      );

      const messages = await prisma.discordMessage.findMany({
        where: {
          projectId: { in: [...projectIds] },
        },
        orderBy: { timestamp: 'desc' },
        take: 50, // Limit to recent 50 messages per project
      });

      // Group messages by project ID
      const messagesByProject = new Map<string, DiscordMessage[]>();
      projectIds.forEach((id) => messagesByProject.set(id, []));

      messages.forEach((message) => {
        if (message.projectId) {
          const projectMessages = messagesByProject.get(message.projectId) ?? [];
          projectMessages.push(message);
          messagesByProject.set(message.projectId, projectMessages);
        }
      });

      return projectIds.map((id) => messagesByProject.get(id) ?? []);
    },
    { name: 'DiscordMessagesByProjectLoader', maxBatchSize: 100 }
  );
}

/**
 * Create a DataLoader for loading Recent Monitoring Events
 *
 * @param prisma - Prisma client instance
 * @param limit - Maximum number of events to load per request (default: 20)
 * @returns DataLoader for MonitoringEvent[] by source
 *
 * @example
 * const monitoringEventsLoader = createMonitoringEventsBySourceLoader(prisma);
 * const flyioEvents = await monitoringEventsLoader.load('Fly.io');
 */
export function createMonitoringEventsBySourceLoader(
  prisma: PrismaClient,
  limit = 20
): DataLoader<string, MonitoringEvent[]> {
  return new DataLoader<string, MonitoringEvent[]>(
    async (sources) => {
      logger.debug(
        'MonitoringEventsBySourceLoader: Batch loading monitoring events by source',
        { count: sources.length, limit }
      );

      const events = await prisma.monitoringEvent.findMany({
        where: {
          source: { in: [...sources] },
        },
        orderBy: { timestamp: 'desc' },
        take: sources.length * limit, // Total limit across all sources
      });

      // Group events by source
      const eventsBySource = new Map<string, MonitoringEvent[]>();
      sources.forEach((source) => eventsBySource.set(source, []));

      events.forEach((event) => {
        const sourceEvents = eventsBySource.get(event.source) ?? [];
        if (sourceEvents.length < limit) {
          sourceEvents.push(event);
          eventsBySource.set(event.source, sourceEvents);
        }
      });

      return sources.map((source) => eventsBySource.get(source) ?? []);
    },
    { name: 'MonitoringEventsBySourceLoader', maxBatchSize: 50 }
  );
}

/**
 * Loader Context - Container for all loaders in a request
 *
 * Create this once per request and pass to resolvers/handlers.
 * Loaders are scoped to a single request lifecycle.
 *
 * @example
 * // In API route or middleware
 * const loaders = createLoaderContext(prisma);
 *
 * // Use loaders
 * const project = await loaders.projectLoader.load('project-123');
 * const quotes = await loaders.quotesByProjectLoader.load('project-123');
 */
export interface LoaderContext {
  projectLoader: DataLoader<string, Project | null>;
  quoteLoader: DataLoader<string, Quote | null>;
  quotesByProjectLoader: DataLoader<string, Quote[]>;
  timeEntriesByProjectLoader: DataLoader<string, TimeEntry[]>;
  activeTimeEntryLoader: DataLoader<string, TimeEntry | null>;
  userLoader: DataLoader<string, User | null>;
  proposalsByQuoteLoader: DataLoader<string, Proposal[]>;
  discordMessagesByProjectLoader: DataLoader<string, DiscordMessage[]>;
  monitoringEventsBySourceLoader: DataLoader<string, MonitoringEvent[]>;
}

/**
 * Create a complete loader context for a request
 *
 * @param prisma - Prisma client instance
 * @returns LoaderContext with all configured loaders
 *
 * @example
 * // Create loaders for a request
 * const loaders = createLoaderContext(prisma);
 *
 * // Use throughout request lifecycle
 * const project = await loaders.projectLoader.load('id1');
 * const quotes = await loaders.quotesByProjectLoader.load('id1');
 * const activeEntry = await loaders.activeTimeEntryLoader.load('id1');
 */
export function createLoaderContext(prisma: PrismaClient): LoaderContext {
  return {
    projectLoader: createProjectLoader(prisma),
    quoteLoader: createQuoteLoader(prisma),
    quotesByProjectLoader: createQuotesByProjectLoader(prisma),
    timeEntriesByProjectLoader: createTimeEntriesByProjectLoader(prisma),
    activeTimeEntryLoader: createActiveTimeEntryLoader(prisma),
    userLoader: createUserLoader(prisma),
    proposalsByQuoteLoader: createProposalsByQuoteLoader(prisma),
    discordMessagesByProjectLoader:
      createDiscordMessagesByProjectLoader(prisma),
    monitoringEventsBySourceLoader:
      createMonitoringEventsBySourceLoader(prisma),
  };
}
