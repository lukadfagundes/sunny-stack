/**
 * Global type declarations for Sunny Stack
 */

import { Client } from 'discord.js';

declare global {
  namespace NodeJS {
    interface Global {
      /** Bot start timestamp for uptime calculation */
      botStartTime?: number;

      /** Discord.js client instance for monitoring */
      discordClient?: Client;

      /** Number of registered bot commands */
      botCommandsCount?: number;
    }
  }

  var botStartTime: number | undefined;
  var discordClient: Client | undefined;
  var botCommandsCount: number | undefined;
}

export {};
