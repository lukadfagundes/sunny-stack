/**
 * Gateway Connection Lifecycle Manager
 *
 * Manages connection state, heartbeat, and reconnection logic
 *
 * @module bot/gateway/lifecycle
 */

import { Client, Events, Status } from 'discord.js';
import { botLogger } from '../core/logger';

/**
 * Track connection state
 */
interface ConnectionState {
  connected: boolean;
  readyAt: Date | null;
  reconnectAttempts: number;
  lastHeartbeat: Date | null;
}

const state: ConnectionState = {
  connected: false,
  readyAt: null,
  reconnectAttempts: 0,
  lastHeartbeat: null,
};

/**
 * Set up connection lifecycle handlers
 *
 * @param client - Discord client
 */
export function setupLifecycleHandlers(client: Client): void {
  // Client ready
  client.once(Events.ClientReady, () => {
    state.connected = true;
    state.readyAt = new Date();
    state.reconnectAttempts = 0;

    botLogger.info('Bot is ready', {
      readyAt: state.readyAt.toISOString(),
      status: client.ws.status,
    });
  });

  // Connection resumed (shard-based event in v14)
  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    state.connected = true;
    state.reconnectAttempts = 0;

    botLogger.info('Connection resumed', {
      shardId,
      replayedEvents,
      status: client.ws.status,
    });
  });

  // Disconnected (shard-based event in v14)
  client.on(Events.ShardDisconnect, (closeEvent, shardId) => {
    state.connected = false;

    botLogger.warn('Bot disconnected', {
      shardId,
      code: closeEvent.code,
      reason: closeEvent.reason,
      reconnectAttempts: state.reconnectAttempts,
    });
  });

  // Invalidated session
  client.on(Events.Invalidated, () => {
    state.connected = false;
    state.reconnectAttempts++;

    botLogger.error('Session invalidated', {
      reconnectAttempts: state.reconnectAttempts,
    });
  });

  // Warning
  client.on(Events.Warn, (info) => {
    botLogger.warn('Gateway warning', { info });
  });

  // Debug (development only)
  if (process.env.NODE_ENV === 'development') {
    client.on(Events.Debug, (info) => {
      if (info.includes('Heartbeat')) {
        state.lastHeartbeat = new Date();
      }
      botLogger.debug('Gateway debug', { info });
    });
  }
}

/**
 * Get current connection state
 *
 * @returns Connection state
 */
export function getConnectionState(): ConnectionState {
  return { ...state };
}

/**
 * Get bot uptime in seconds
 *
 * @returns Uptime in seconds, or 0 if not ready
 */
export function getUptime(): number {
  if (!state.readyAt) {
    return 0;
  }

  const now = new Date();
  return Math.floor((now.getTime() - state.readyAt.getTime()) / 1000);
}

/**
 * Check if bot is healthy
 *
 * @returns True if bot is connected and healthy
 */
export function isHealthy(): boolean {
  if (!state.connected || !state.readyAt) {
    return false;
  }

  // Check if last heartbeat was within 60 seconds
  if (state.lastHeartbeat) {
    const now = new Date();
    const timeSinceHeartbeat = now.getTime() - state.lastHeartbeat.getTime();

    if (timeSinceHeartbeat > 60000) {
      // No heartbeat in 60s
      botLogger.warn('No heartbeat in 60 seconds', {
        lastHeartbeat: state.lastHeartbeat.toISOString(),
      });
      return false;
    }
  }

  return true;
}

/**
 * Get connection statistics
 *
 * @param client - Discord client
 * @returns Connection stats
 */
export function getConnectionStats(client: Client) {
  return {
    status: Status[client.ws.status],
    ping: client.ws.ping,
    uptime: getUptime(),
    guilds: client.guilds.cache.size,
    channels: client.channels.cache.size,
    users: client.users.cache.size,
    reconnectAttempts: state.reconnectAttempts,
    healthy: isHealthy(),
  };
}
