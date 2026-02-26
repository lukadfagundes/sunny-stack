/**
 * @file Vercel Monitoring Service
 * @description Background monitoring for Vercel deployments and domains with Discord notifications
 */

import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@/lib/db/prisma";
import logger from "@/lib/logger";
import {
  getRecentDeployments,
  getFailedDeployments,
  getVercelHealth,
} from "@/lib/integrations/vercel";

const VERCEL_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const getNotificationChannel = () => process.env.DISCORD_CHANNEL_ADMIN_LOGS;

// Track when monitoring started to avoid alerting on old deployments
const monitoringStartTime = Date.now();

interface MonitoredDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  target: string | null;
  created: number;
  commitMessage?: string;
  commitAuthor?: string;
  commitSha?: string;
}

let vercelMonitorInterval: NodeJS.Timeout | null = null;
let lastDeploymentCheck: Map<string, MonitoredDeployment> = new Map();

/**
 * Send Discord notification for deployment failure
 */
async function notifyDeploymentFailure(
  client: Client,
  deployment: MonitoredDeployment,
): Promise<void> {
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
      .setTitle("❌ Vercel Deployment Failed")
      .setColor(0xff0000)
      .setDescription(`**${deployment.name}** deployment failed`)
      .addFields(
        { name: "🌐 URL", value: `https://${deployment.url}`, inline: true },
        {
          name: "🎯 Target",
          value:
            deployment.target === "production" ? "🟢 Production" : "🟡 Preview",
          inline: true,
        },
      );

    if (deployment.commitMessage) {
      embed.addFields({
        name: "📝 Commit",
        value: `${deployment.commitMessage}\n${deployment.commitAuthor ? `by ${deployment.commitAuthor}` : ""}`,
        inline: false,
      });
    }

    if (deployment.commitSha) {
      embed.addFields({
        name: "🔗 Commit SHA",
        value: `\`${deployment.commitSha.substring(0, 7)}\``,
        inline: true,
      });
    }

    embed.setTimestamp(deployment.created);
    embed.setFooter({ text: "Vercel Monitoring" });

    await channel.send({ embeds: [embed] });

    logger.info(`Sent deployment failure notification for ${deployment.name}`);
  } catch (error) {
    logger.error(
      "Failed to send Vercel deployment failure notification:",
      error,
    );
  }
}

/**
 * Send Discord notification for successful production deployment
 */
async function notifyProductionDeployment(
  client: Client,
  deployment: MonitoredDeployment,
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
      .setTitle("🚀 Production Deployment Successful")
      .setColor(0x00ff00)
      .setDescription(`**${deployment.name}** deployed to production`)
      .addFields({
        name: "🌐 URL",
        value: `https://${deployment.url}`,
        inline: false,
      });

    if (deployment.commitMessage) {
      embed.addFields({
        name: "📝 Commit",
        value: `${deployment.commitMessage}\n${deployment.commitAuthor ? `by ${deployment.commitAuthor}` : ""}`,
        inline: false,
      });
    }

    embed.setTimestamp(deployment.created);
    embed.setFooter({ text: "Vercel Monitoring" });

    await channel.send({ embeds: [embed] });

    logger.info(
      `Sent production deployment notification for ${deployment.name}`,
    );
  } catch (error) {
    logger.error("Failed to send production deployment notification:", error);
  }
}

/**
 * Monitor Vercel deployments and notify on failures/successes
 */
async function monitorDeployments(client: Client): Promise<void> {
  try {
    const recentDeployments = await getRecentDeployments(20);

    for (const deployment of recentDeployments) {
      const monitored: MonitoredDeployment = {
        uid: deployment.uid,
        name: deployment.name,
        url: deployment.url,
        state: deployment.state,
        target: deployment.target,
        created: deployment.created,
        commitMessage: deployment.meta?.githubCommitMessage,
        commitAuthor: deployment.meta?.githubCommitAuthorName,
        commitSha: deployment.meta?.githubCommitSha,
      };

      const previous = lastDeploymentCheck.get(deployment.uid);

      // Only alert on deployments created after monitoring started
      const deploymentTime = new Date(monitored.created).getTime();
      const isRecentDeployment = deploymentTime > monitoringStartTime;

      // New deployment failure detected
      if (deployment.state === "ERROR" && !previous && isRecentDeployment) {
        await notifyDeploymentFailure(client, monitored);

        // Create alert in database (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: "ERROR",
                severity: "CRITICAL",
                source: "Vercel",
                message: `Deployment failed: ${monitored.name}`,
                timestamp: new Date(monitored.created),
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error("Failed to create monitoring alert", error);
          }
        });
      }

      // New production deployment succeeded
      if (
        deployment.state === "READY" &&
        deployment.target === "production" &&
        !previous &&
        isRecentDeployment
      ) {
        await notifyProductionDeployment(client, monitored);

        // Create notification alert (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: "DEPLOYMENT",
                severity: "INFO",
                source: "Vercel",
                message: `Production deployment: ${monitored.name}`,
                timestamp: new Date(monitored.created),
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error("Failed to create monitoring alert", error);
          }
        });
      }

      // Deployment recovered (was error, now ready)
      if (
        deployment.state === "READY" &&
        previous &&
        previous.state === "ERROR"
      ) {
        const recoveryEmbed = new EmbedBuilder()
          .setTitle("✅ Vercel Deployment Recovered")
          .setColor(0x00ff00)
          .setDescription(`**${monitored.name}** deployment succeeded`)
          .addFields({
            name: "🌐 URL",
            value: `https://${monitored.url}`,
            inline: false,
          })
          .setTimestamp(monitored.created)
          .setFooter({ text: "Vercel Monitoring" });

        const channel = await client.channels.fetch(getNotificationChannel()!);
        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [recoveryEmbed] });
        }

        // Create recovery alert (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.monitoringAlert.create({
              data: {
                type: "UPTIME_CHECK",
                severity: "INFO",
                source: "Vercel",
                message: `Deployment recovered: ${monitored.name}`,
                timestamp: new Date(monitored.created),
                metadata: monitored as any,
              },
            });
          } catch (error) {
            logger.error("Failed to create monitoring alert", error);
          }
        });
      }

      lastDeploymentCheck.set(deployment.uid, monitored);
    }

    // Clean up old entries (keep last 100)
    if (lastDeploymentCheck.size > 100) {
      const entries = Array.from(lastDeploymentCheck.entries());
      lastDeploymentCheck = new Map(entries.slice(-100));
    }
  } catch (error) {
    logger.error("Failed to monitor Vercel deployments:", error);
  }
}

/**
 * Run all Vercel monitoring checks
 */
async function runVercelMonitoring(client: Client): Promise<void> {
  try {
    logger.info("Running Vercel monitoring checks...");

    await monitorDeployments(client);

    logger.info("Vercel monitoring checks complete");
  } catch (error) {
    logger.error("Vercel monitoring failed:", error);
  }
}

/**
 * Start Vercel background monitoring
 */
export function startVercelMonitoring(client: Client): void {
  if (vercelMonitorInterval) {
    logger.warn("Vercel monitoring already running, restarting...");
    stopVercelMonitoring();
  }

  // Run initial check immediately (channels are already cached)
  runVercelMonitoring(client);

  // Schedule recurring checks
  vercelMonitorInterval = setInterval(() => {
    runVercelMonitoring(client);
  }, VERCEL_POLL_INTERVAL);

  logger.info(
    `Vercel monitoring started (${VERCEL_POLL_INTERVAL / 60000}-minute interval)`,
  );
}

/**
 * Stop Vercel background monitoring
 */
export function stopVercelMonitoring(): void {
  if (vercelMonitorInterval) {
    clearInterval(vercelMonitorInterval);
    vercelMonitorInterval = null;
    logger.info("Vercel monitoring stopped");
  }
}
