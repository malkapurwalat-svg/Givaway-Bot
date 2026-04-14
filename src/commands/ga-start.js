const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");
const GiveawayRun = require("../models/GiveawayRun");
const { buildLiveEmbed } = require("../utils/embeds");
const { scheduleGiveawayLifecycle } = require("../utils/runtime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxstart")
    .setDescription("Start a giveaway on your own message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt => opt.setName("token").setDescription("Saved token").setRequired(true))
    .addStringOption(opt => opt.setName("message_id").setDescription("Your manual giveaway message ID").setRequired(true))
    .addStringOption(opt => opt.setName("ending_message_1").setDescription("Half-time warning. Use {time}").setRequired(false))
    .addStringOption(opt => opt.setName("ending_message_2").setDescription("Quarter-time warning. Use {time}").setRequired(false))
    .addStringOption(opt => opt.setName("winner_announcement").setDescription("Final winner message. Use {winner_mentions}").setRequired(false)),

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
        content: "❌ A giveaway with this token is already running.",
        ephemeral: true
      });
    }

    const channel = await client.channels.fetch(template.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: "❌ Giveaway channel not found.",
        ephemeral: true
      });
    }

    const announcementMsg = await channel.messages.fetch(messageId).catch(() => null);
    if (!announcementMsg) {
      return interaction.reply({
        content: "❌ Could not find that message ID in the saved channel.",
        ephemeral: true
      });
    }

    const run = await GiveawayRun.create({
      guildId: interaction.guild.id,
      templateToken: token,
      prize: template.prize,
      durationMs: template.durationMs,
      winnerCount: template.winnerCount,
      channelId: channel.id,
      messageId: announcementMsg.id,
      hostUserId: interaction.user.id,
      winnerDmMessage: template.winnerDmMessage,
      participantDmMessage: template.participantDmMessage,
      customEndingMessage1: endingMessage1,
      customEndingMessage2: endingMessage2,
      customWinnerAnnouncement: winnerAnnouncement,
      participants: [],
      winnerIds: [],
      status: "running",
      startedAt: Date.now(),
      endsAt: Date.now() + template.durationMs
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_${run._id}`)
        .setLabel("🎉 Join Giveaway")
        .setStyle(ButtonStyle.Success)
    );

    const statusMessage = await channel.send({
      embeds: [buildLiveEmbed(run)],
      components: [row]
    });

    run.statusMessageId = statusMessage.id;
    await run.save();

    await interaction.reply({
      content: "✅ Giveaway started!",
      ephemeral: true
    });

    scheduleGiveawayLifecycle(client, run._id, run.durationMs);
  }
};
