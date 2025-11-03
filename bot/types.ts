/**
 * Discord Bot Type Definitions
 *
 * Centralized TypeScript interfaces for the Discord bot
 *
 * @module bot/types
 */

import type { Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * Deployment mode for the bot
 */
export enum DeploymentMode {
  VERCEL = 'vercel',
  RASPBERRY_PI = 'pi',
}

/**
 * Permission levels for commands
 */
export enum PermissionLevel {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Bot configuration interface
 */
export interface BotConfig {
  /** Discord bot token */
  token: string;
  /** Discord application/client ID */
  applicationId: string;
  /** Discord guild (server) ID */
  guildId: string;
  /** Admin Discord user ID */
  adminUserId: string;
  /** Deployment mode */
  deploymentMode: DeploymentMode;
  /** Bot API base URL */
  apiUrl: string;
  /** Bot API authentication key */
  apiKey: string;
}

/**
 * Discord channel configuration
 */
export interface ChannelConfig {
  // Administrative Channels
  adminLogs: string;           // #admin-logs - Bot activity logs, configuration changes
  botCommands: string;          // #bot-commands - Admin commands and bot configuration

  // Project Management Channels
  activeProjects: string;       // #active-projects - Active client projects tracking
  proposals: string;            // #proposals - Client proposals and quotes
  tasks: string;                // #tasks - Task tracking and management
  timeTracking: string;         // #time-tracking - Time entry logs and summaries

  // Client Communication Channels
  clientInquiries: string;      // #client-inquiries - New client inquiries from contact/quote forms
  clientUpdates: string;        // #client-updates - Updates sent to clients

  // Automation & Monitoring Channels
  calendarSync: string;         // #calendar-sync - Google Calendar event notifications
  emailNotifications: string;   // #email-notifications - Gmail monitoring and notifications
  analytics: string;            // #analytics - Website analytics and metrics

  // Financial Channels
  invoices: string;             // #invoices - Invoice generation and tracking
  payments: string;             // #payments - Payment notifications and tracking
}

/**
 * Command interface
 */
export interface Command {
  /** Slash command builder data */
  data: SlashCommandBuilder;
  /** Command execution handler */
  execute(interaction: CommandInteraction): Promise<void>;
  /** Required permission level */
  permissions?: PermissionLevel;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Project data from API
 */
export interface Project {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  clientEmail: string;
  status: ProjectStatus;
  budget: number | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    quotes: number;
    timeEntries: number;
  };
}

/**
 * Project status enum
 */
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETE = 'COMPLETE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Quote data from API
 */
export interface Quote {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: string;
  budgetRange: string | null;
  timeline: string | null;
  description: string;
  status: QuoteStatus;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quote status enum
 */
export enum QuoteStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  CONVERTED = 'CONVERTED',
}

/**
 * Time entry data from API
 */
export interface TimeEntry {
  id: string;
  projectId: string;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  loggedVia: string;
  createdAt: string;
}

/**
 * Monitoring event data
 */
export interface MonitoringEvent {
  id: string;
  type: EventType;
  severity: Severity;
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

/**
 * Event type enum
 */
export enum EventType {
  DEPLOYMENT = 'DEPLOYMENT',
  UPTIME_CHECK = 'UPTIME_CHECK',
  ERROR = 'ERROR',
  ALERT = 'ALERT',
}

/**
 * Severity level enum
 */
export enum Severity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Webhook notification event
 */
export interface WebhookEvent {
  type: 'quote.created' | 'project.updated' | 'proposal.generated' | 'monitoring.alert';
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Rate limit tracking
 */
export interface RateLimitData {
  count: number;
  resetAt: number;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  failures: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  openedAt: number | null;
}
