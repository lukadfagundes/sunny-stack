/**
 * @file Fly.io Monitoring Service
 * @description Background monitoring for Fly.io apps and machines with Discord notifications
 */

import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@/lib/db/prisma";
import logger from "@/lib/logger";
import { getApps, getAppMachines } from "@/lib/integrations/flyio";

const FLYIO_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const getNotificationChannel = () => process.env.DISCORD_CHANNEL_ADMIN_LOGS;

interface MonitoredApp {
  name: string;
  status: string;
  deployed: boolean;
  hostname: string;
  machineCount: number;
  machineStates: Record<string, number>;
}

let flyioMonitorInterval: NodeJS.Timeout | null = null;
const lastAppCheck: Map<string, MonitoredApp> = new Map();

/**
 * Send Discord notification for app down
 */
async function notifyAppDown(client: Client, app: MonitoredApp): Promise<void> {
  if (!getNotificationChannel()) {
    logger.warn(
      "DISCORD_CHANNEL_ADMIN_LOGS not configured, skipping notification",
    );
    return;
  }

  if (!client || !client.isReady()) {
    logger.debug(
      "Discord client not available or not ready, skipping notification",
    );
    return;
  }

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error("No guild found in cache");
      return;
    }

    const channel = guild.channels.cache.get(getNotificationChannel()!);

    if (!channel || !channel.isTextBased()) {
      logger.error("Admin logs channel not found or not a text channel");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("❌ Fly.io App Down")
      .setColor(0xff0000)
      .setDescription(`**${app.name}** is not running`)
      .addFields(
        { name: "🌐 Hostname", value: app.hostname || "N/A", inline: true },
        { name: "📊 Status", value: app.status, inline: true },
        {
          name: "🖥️ Machines",
          value: app.machineCount.toString(),
          inline: true,
        },
      );

    if (Object.keys(app.machineStates).length > 0) {
      const statesText = Object.entries(app.machineStates)
        .map(([state, count]) => `${state}: ${count}`)
        .join("\n");
      embed.addFields({
        name: "⚙️ Machine States",
        value: statesText,
        inline: false,
      });
    }

    embed.setTimestamp();
    embed.setFooter({ text: "Fly.io Monitoring" });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent app down notification for ${app.name}`);
  } catch (error) {
    logger.error("Failed to send Fly.io app down notification:", error);
  }
}

/**
 * Send Discord notification for app recovery
 */
async function notifyAppRecovery(
  client: Client,
  app: MonitoredApp,
): Promise<void> {
  if (!getNotificationChannel()) return;

  if (!client || !client.isReady()) {
    logger.debug(
      "Discord client not available or not ready, skipping notification",
    );
    return;
  }

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      logger.error("No guild found in cache");
      return;
    }

    const channel = guild.channels.cache.get(getNotificationChannel()!);

    if (!channel || !channel.isTextBased()) {
      logger.error("Admin logs channel not found");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ Fly.io App Recovered")
      .setColor(0x00ff00)
      .setDescription(`**${app.name}** is now running`)
      .addFields(
        { name: "🌐 Hostname", value: app.hostname || "N/A", inline: true },
        { name: "📊 Status", value: app.status, inline: true },
        {
          name: "🖥️ Machines",
          value: app.machineCount.toString(),
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: "Fly.io Monitoring" });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent app recovery notification for ${app.name}`);
  } catch (error) {
    logger.error("Failed to send Fly.io app recovery notification:", error);
  }
}

/**
 * Send Discord notification for machine state changes
 */
async function notifyMachineStateChange(
  client: Client,
  appName: string,
  previousStates: Record<string, number>,
  currentStates: Record<string, number>,
): Promise<void> {
  if (!getNotificationChannel()) return;

  if (!client || !client.isReady()) {
    logger.debug(
      "Discord client not available or not ready, skipping notification",
    );
    return;
  }

  try {
    const fetchedChannel = await client.channels.fetch(
      getNotificationChannel()!,
    );

    if (!fetchedChannel || !fetchedChannel.isTextBased()) return;
    const channel = fetchedChannel as TextChannel;

    const changes: string[] = [];

    // Check for new states or state count changes
    for (const [state, count] of Object.entries(currentStates)) {
      const prevCount = previousStates[state] || 0;
      if (count !== prevCount) {
        changes.push(`${state}: ${prevCount} → ${count}`);
      }
    }

    // Check for removed states
    for (const [state, count] of Object.entries(previousStates)) {
      if (!currentStates[state]) {
        changes.push(`${state}: ${count} → 0`);
      }
    }

    if (changes.length === 0) return;

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Fly.io Machine State Change")
      .setColor(0xffa500)
      .setDescription(`Machine states changed for **${appName}**`)
      .addFields({
        name: "🔄 Changes",
        value: changes.join("\n"),
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: "Fly.io Monitoring" });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent machine state change notification for ${appName}`);
  } catch (error) {
    logger.error("Failed to send machine state change notification:", error);
  }
}

/**
 * Monitor Fly.io apps and notify on status changes
 */
async function monitorApps(client: Client): Promise<void> {
  try {
    const apps = await getApps();

    for (const app of apps) {
      // Get machines for the app
      let machines: any[] = [];
      try {
        machines = await getAppMachines(app.name);
      } catch (error) {
        logger.warn(`Failed to get machines for ${app.name}:`, error);
      }

      const machineStates = machines.reduce(
        (acc, m) => {
          acc[m.state] = (acc[m.state] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const monitored: MonitoredApp = {
        name: app.name,
        status: app.status,
        deployed: app.deployed,
        hostname: app.hostname,
        machineCount: machines.length,
        machineStates,
      };

      const previous = lastAppCheck.get(app.name);

      // Determine if app is actually running
      // Fly.io apps can have status: 'deployed', 'running', 'suspended', etc.
      // An app is considered "up" if it's deployed OR has running/deployed status
      // An app is considered "down" if it's not deployed AND status is not running/deployed
      // We ignore 'suspended' apps as those are intentionally stopped
      const isRunning =
        app.deployed || app.status === "running" || app.status === "deployed";
      const isSuspended = app.status === "suspended";
      const wasRunning =
        previous &&
        (previous.deployed ||
          previous.status === "running" ||
          previous.status === "deployed");

      // App went down (skip suspended apps as they're intentionally stopped)
      if (!isRunning && !isSuspended && wasRunning) {
        await notifyAppDown(client, monitored);

        // Create alert in database (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: "ERROR",
                severity: "CRITICAL",
                source: "Fly.io",
                message: `App down: ${monitored.name}`,
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error("Failed to create monitoring alert", error);
          }
        });
      }

      // App recovered (from down to running, not from suspended)
      if (
        isRunning &&
        previous &&
        !wasRunning &&
        previous.status !== "suspended"
      ) {
        await notifyAppRecovery(client, monitored);

        // Create recovery alert (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: "UPTIME_CHECK",
                severity: "INFO",
                source: "Fly.io",
                message: `App recovered: ${monitored.name}`,
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error("Failed to create monitoring alert", error);
          }
        });
      }

      // Machine state changes
      if (
        previous &&
        JSON.stringify(previous.machineStates) !== JSON.stringify(machineStates)
      ) {
        await notifyMachineStateChange(
          client,
          app.name,
          previous.machineStates,
          machineStates,
        );
      }

      lastAppCheck.set(app.name, monitored);
    }

    // Clean up old entries (apps that no longer exist)
    const currentAppNames = new Set(apps.map((a) => a.name));
    for (const [appName] of lastAppCheck) {
      if (!currentAppNames.has(appName)) {
        lastAppCheck.delete(appName);
      }
    }
  } catch (error) {
    logger.error("Failed to monitor Fly.io apps:", error);
  }
}

/**
 * Run all Fly.io monitoring checks
 */
async function runFlyioMonitoring(client: Client): Promise<void> {
  try {
    logger.info("Running Fly.io monitoring checks...");

    await monitorApps(client);

    logger.info("Fly.io monitoring checks complete");
  } catch (error) {
    logger.error("Fly.io monitoring failed:", error);
  }
}

/**
 * Start Fly.io background monitoring
 */
export function startFlyioMonitoring(client: Client): void {
  if (flyioMonitorInterval) {
    logger.warn("Fly.io monitoring already running, restarting...");
    stopFlyioMonitoring();
  }

  // Run initial check immediately (channels are already cached)
  runFlyioMonitoring(client);

  // Schedule recurring checks
  flyioMonitorInterval = setInterval(() => {
    runFlyioMonitoring(client);
  }, FLYIO_POLL_INTERVAL);

  logger.info(
    `Fly.io monitoring started (${FLYIO_POLL_INTERVAL / 60000}-minute interval)`,
  );
}

/**
 * Stop Fly.io background monitoring
 */
export function stopFlyioMonitoring(): void {
  if (flyioMonitorInterval) {
    clearInterval(flyioMonitorInterval);
    flyioMonitorInterval = null;
    logger.info("Fly.io monitoring stopped");
  }
}
