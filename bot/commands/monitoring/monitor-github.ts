/**
 * /monitor-github Command
 *
 * Display GitHub repository, workflow, and pull request status
 *
 * @module bot/commands/monitoring/monitor-github
 */

import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { COLORS } from '../../utils/embed-builder';

/**
 * Monitor GitHub Command
 */
export class MonitorGitHubCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('monitor-github')
    .setDescription('View GitHub repository, workflow, and pull request status') as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.deferReply(interaction);

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.get<{
      status: string;
      data: {
        health: {
          authenticated: boolean;
          user: string;
          rateLimit: {
            remaining: number;
            limit: number;
            resetAt: string;
          };
        };
        repositories: {
          total: number;
          recentlyUpdated: Array<{
            name: string;
            url: string;
            updatedAt: string;
          }>;
        };
        workflows: {
          recent: number;
          failed: number;
          failedRuns: Array<{
            name: string;
            repository: string;
            branch: string;
            url: string;
            createdAt: string;
          }>;
        };
        pullRequests: {
          open: number;
          recentPRs: Array<{
            number: number;
            title: string;
            url: string;
            author: string;
            updatedAt: string;
          }>;
        };
      };
      timestamp: string;
    }>('/admin/monitor/github');

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch GitHub status');
    }

    const { health, repositories, workflows, pullRequests } = response.data.data;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle('📊 GitHub Status')
      .setColor(workflows.failed > 0 ? COLORS.ERROR : COLORS.SUCCESS)
      .setTimestamp();

    // Health section
    embed.addFields({
      name: '🔐 Authentication',
      value: health.authenticated
        ? `✅ Authenticated as **${health.user}**\n📊 API Rate Limit: ${health.rateLimit.remaining}/${health.rateLimit.limit}`
        : '❌ Not authenticated',
      inline: false,
    });

    // Repositories section
    embed.addFields({
      name: '📁 Repositories',
      value: `**Total:** ${repositories.total}\n\n**Recently Updated:**\n${
        repositories.recentlyUpdated.length > 0
          ? repositories.recentlyUpdated
              .slice(0, 5)
              .map((r) => `• [${r.name}](${r.url})`)
              .join('\n')
          : '_No recent updates_'
      }`,
      inline: false,
    });

    // Workflows section
    const workflowStatus = workflows.failed > 0 ? '❌' : '✅';
    embed.addFields({
      name: `${workflowStatus} Workflows`,
      value: `**Recent Runs:** ${workflows.recent}\n**Failed (24h):** ${workflows.failed}\n\n${
        workflows.failedRuns.length > 0
          ? workflows.failedRuns
              .slice(0, 3)
              .map(
                (w) =>
                  `• **${w.repository}** - [${w.name}](${w.url})\n  Branch: \`${w.branch}\``
              )
              .join('\n')
          : '_No failed workflows_'
      }`,
      inline: false,
    });

    // Pull requests section
    embed.addFields({
      name: '🔀 Pull Requests',
      value: `**Open:** ${pullRequests.open}\n\n${
        pullRequests.recentPRs.length > 0
          ? pullRequests.recentPRs
              .slice(0, 3)
              .map((pr) => `• [#${pr.number}](${pr.url}) - ${pr.title}\n  by @${pr.author}`)
              .join('\n')
          : '_No open pull requests_'
      }`,
      inline: false,
    });

    embed.setFooter({
      text: `Last updated: ${new Date(response.data.timestamp).toLocaleString()}`,
    });

    await interaction.followUp({
      embeds: [embed],
    });
  }
}

export default new MonitorGitHubCommand();
