const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const { parseDuration, formatDuration } = require("../utils/duration");
const { buildTemplatePreviewEmbed } = require("../utils/embeds");
const GiveawayTemplate = require("../models/GiveawayTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-create")
    .setDescription("Create a giveaway template.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addStringOption(opt =>
      opt.setName("token").setDescription("Unique token").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("prize").setDescription("Prize name").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("duration").setDescription("e.g. 24h, 1h").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("winners").setDescription("Number of winners").setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("channel").setDescription("Giveaway channel").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("announcement").setDescription("Announcement message").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("winner_dm").setDescription("Winner DM message").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("participant_dm").setDescription("Participant DM message").setRequired(true)
    ),

  async execute(interaction) {
    if (!(await ensureAdmin(interaction))) return;

    const token = interaction.options.getString("token");
    const prize = interaction.options.getString("prize");
    const durationInput = interaction.options.getString("duration");
    const winners = interaction.options.getInteger("winners");
    const channel = interaction.options.getChannel("channel");
    const announcement = interaction.options.getString("announcement");
    const winnerDM = interaction.options.getString("winner_dm");
    const participantDM = interaction.options.getString("participant_dm");

    // Parse duration
    let durationMs;
    try {
      durationMs = parseDuration(durationInput);
    } catch (e) {
      return interaction.reply({
        content: "❌ Invalid duration. Example: 24h",
        ephemeral: true
      });
    }

    // Check duplicate token
    const existing = await GiveawayTemplate.findOne({
      guildId: interaction.guild.id,
      token
    });

    if (existing) {
      return interaction.reply({
        content: "❌ Token already exists. Use a different one.",
        ephemeral: true
      });
    }

    // Build preview
    const previewEmbed = buildTemplatePreviewEmbed({
      token,
      prize,
      durationMs,
      winnerCount: winners,
      channelId: channel.id,
      announcementMessage: announcement,
      winnerDmMessage: winnerDM,
      participantDmMessage: participantDM,
      createdBy: interaction.user.id
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ga_save_${token}`)
        .setLabel("Save")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ga_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [previewEmbed],
      components: [row],
      ephemeral: true
    });

    // Button collector
    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000
    });

    collector.on("collect", async i => {
      if (i.customId === "ga_cancel") {
        return i.update({
          content: "❌ Giveaway creation cancelled.",
          embeds: [],
          components: []
        });
      }

      if (i.customId === `ga_save_${token}`) {
        await GiveawayTemplate.create({
          guildId: interaction.guild.id,
          token,
          prize,
          durationMs,
          winnerCount: winners,
          channelId: channel.id,
          announcementMessage: announcement,
          winnerDmMessage: winnerDM,
          participantDmMessage: participantDM,
          createdBy: interaction.user.id
        });

        return i.update({
          content: `✅ Giveaway template saved with token: ${token}`,
          embeds: [],
          components: []
        });
      }
    });
  }
};
