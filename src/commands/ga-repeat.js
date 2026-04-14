const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");
const GiveawayRun = require("../models/GiveawayRun");
const {
  buildStatusMessage,
  scheduleGiveawayLifecycle
} = require("../utils/giveawayRuntime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxrepeat")
    .setDescription("Repeat a saved giveaway on an existing message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("token").setDescription("Saved token").setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("message_id")
        .setDescription("Message ID of your manual giveaway announcement")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("ending_message_1")
        .setDescription("Optional message for halfway warning. Use {time} if you want.")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName("ending_message_2")
        .setDescription("Optional message for quarter-time warning. Use {time} if you want.")
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName("winner_announcement")
        .setDescription("Optional final winner message. Use {winner_mentions}, {prize}, {token}.")
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const token = interaction.options.getString("token");
    const messageId = interaction.options.getString("message_id");
    const endingMessage1 = interaction.options.getString("ending_message_1") || "";
    const endingMessage2 = interaction.options.getString("ending_message_2") || "";
    const winnerAnnouncement = interaction.options.getString("winner_announcement") || "";

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

    const alreadyRunning = await GiveawayRun.findOne({
      guildId: interaction.guild.id,
      templateToken: token,
      status: "running"
    });

    if (alreadyRunning) {
      return interaction.reply({
        content: "❌ A giveaway with this token is already running. Wait for it to finish first.",
        ephemeral: true
      });
    }

    const channel = await client.channels.fetch(template.channelId).catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: "❌ Giveaway channel not found or not usable.",
        ephemeral: true
      });
    }

    const existingMessage = await channel.messages.fetch(messageId).catch(() => null);

    if (!existingMessage) {
      return interaction.reply({
        content: "❌ Could not find that message ID in the saved giveaway channel.",
        ephemeral: true
      });
    }

    await existingMessage.react("🎉").catch(() => null);

    const run = await GiveawayRun.create({
      guildId: interaction.guild.id,
      templateToken: token,
      prize: template.prize,
      durationMs: template.durationMs,
      winnerCount: template.winnerCount,
      channelId: channel.id,
      messageId: existingMessage.id,
      hostUserId: interaction.user.id,
      announcementMessage: template.announcementMessage,
      winnerDmMessage: template.winnerDmMessage,
      participantDmMessage: template.participantDmMessage,
      customEndingMessage1: endingMessage1,
      customEndingMessage2: endingMessage2,
      customWinnerAnnouncement: winnerAnnouncement,
      status: "running",
      startedAt: new Date(),
      endsAt: new Date(Date.now() + template.durationMs),
      participantIds: [],
      winnerIds: []
    });

    await interaction.reply({
      content: buildStatusMessage(run)
    });

    const statusMessage = await interaction.fetchReply();
    run.statusMessageId = statusMessage.id;
    await run.save();

    scheduleGiveawayLifecycle(client, run._id, run.durationMs);
  }
};
