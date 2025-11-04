/**
 * /project create Command
 *
 * Creates a new project in the database
 *
 * @module bot/commands/project/create
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../base-command';
import { PermissionLevel } from '../../types';
import { ApiClient } from '../../core/api-client';
import { loadBotConfig } from '../../config';
import { validateTitle, validateEmail, validateBudget, validateDate, validateDescription } from '../../core/validators';
import { createSuccessEmbed, createProjectEmbed } from '../../utils/embed-builder';
import { formatCurrency } from '../../utils/formatters';

/**
 * Project Create Command
 */
export class ProjectCreateCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('project-create')
    .setDescription('Create a new client project')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Project title')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('client-name')
        .setDescription('Client name')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('client-email')
        .setDescription('Client email address')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Project description')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('budget')
        .setDescription('Project budget (dollars)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('deadline')
        .setDescription('Project deadline (DD-MM-YYYY)')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('status')
        .setDescription('Project status')
        .setRequired(false)
        .addChoices(
          { name: 'Planning', value: 'PLANNING' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
          { name: 'Review', value: 'REVIEW' },
          { name: 'Complete', value: 'COMPLETE' },
          { name: 'Archived', value: 'ARCHIVED' }
        )
    ) as SlashCommandBuilder;

  permissions = PermissionLevel.ADMIN;

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    // Defer reply for long-running operation
    await this.deferReply(interaction);

    // Get command options
    const title = interaction.options.getString('title', true);
    const clientName = interaction.options.getString('client-name', true);
    const clientEmail = interaction.options.getString('client-email', true);
    const descriptionRaw = interaction.options.getString('description') ?? undefined;
    const budgetRaw = interaction.options.getString('budget') ?? undefined;
    const deadlineRaw = interaction.options.getString('deadline') ?? undefined;
    const status = interaction.options.getString('status') ?? 'PLANNING';

    // Validate inputs
    const validatedTitle = validateTitle(title);
    const validatedClientName = validateTitle(clientName);
    const validatedClientEmail = validateEmail(clientEmail);
    const validatedDescription = validateDescription(descriptionRaw, false);
    const validatedBudget = budgetRaw ? validateBudget(budgetRaw) : null;
    const validatedDeadline = deadlineRaw ? validateDate(deadlineRaw) : null;

    // Build request body
    const projectData = {
      title: validatedTitle,
      clientName: validatedClientName,
      clientEmail: validatedClientEmail,
      description: validatedDescription,
      status,
      budget: validatedBudget,
      deadline: validatedDeadline?.toISOString(),
    };

    // Call API
    const config = loadBotConfig();
    const apiClient = new ApiClient(config.apiUrl, config.apiKey);

    const response = await apiClient.post<{ project: any }>(
      '/admin/projects',
      projectData
    );

    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create project');
    }

    const project = response.data.project;

    // Send success response
    const successEmbed = createSuccessEmbed(
      'Project Created',
      `Successfully created project **${project.title}**`
    );

    const projectEmbed = createProjectEmbed({
      title: project.title,
      description: project.description,
      status: project.status,
      budget: project.budget,
      deadline: project.deadline,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
    });

    await interaction.followUp({
      embeds: [successEmbed, projectEmbed],
    });
  }
}

// Export instance for registration
export default new ProjectCreateCommand();
