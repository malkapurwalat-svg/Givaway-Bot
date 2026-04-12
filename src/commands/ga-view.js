const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");
const { formatDuration } = require("../utils/duration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-view")
    .setDescription("View a saved giveaway template.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName("token")
        .setDescription("Saved giveaway token")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!(await ensureAdmin(interaction))) return;

    const token = interaction.options.getString("token");

    const template = await GiveawayTemplate.findOne({
      guildId: interaction.guild.id,
      token
    });

    if (!template) {
      return interaction.reply({
        content: "❌ No giveaway template found with that token.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎁 Giveaway Template Details")
      .addFields(
        { name: "Token", value: template.token, inline: true },
        { name: "Prize", value: template.prize, inline: true },
        { name: "Winners", value: String(template.winnerCount), inline: true },
        { name: "Duration", value: formatDuration(template.durationMs), inline: true },
        { name: "Channel", value: `<#${template.channelId}>`, inline: true },
        { name: "Created By", value: `<@${template.createdBy}>`, inline: true },
        { name: "Announcement", value: template.announcementMessage.slice(0, 1024) },
        { name: "Winner DM", value: template.winnerDmMessage.slice(0, 1024) },
        { name: "Participant DM", value: template.participantDmMessage.slice(0, 1024) }
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
