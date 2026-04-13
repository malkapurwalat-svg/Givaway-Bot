const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");
const GiveawayRun = require("../models/GiveawayRun");
const {
  buildEndingSoonEmbed,
  buildWinnersEmbed,
  buildNoParticipantsEmbed
} = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxstart")
    .setDescription("Start a giveaway using a saved token on an existing message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("token").setDescription("Saved token").setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("message_id")
        .setDescription("The message ID of your manual giveaway announcement")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const token = interaction.options.getString("token");
    const messageId = interaction.options.getString("message_id");

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
      status: "running",
      startedAt: new Date(),
      endsAt: new Date(Date.now() + template.durationMs),
      participantIds: [],
      winnerIds: []
    });

    await interaction.reply({
      content: `✅ Giveaway attached to message \`${messageId}\` in <#${channel.id}>.`,
      ephemeral: true
    });

    const endingSoonMs = 10 * 60 * 1000;

    if (template.durationMs > endingSoonMs) {
      setTimeout(async () => {
        try {
          const freshRun = await GiveawayRun.findById(run._id);
          if (!freshRun || freshRun.status !== "running") return;

          const endingSoonEmbed = buildEndingSoonEmbed(
            template.prize,
            template.winnerCount,
            10
          );

          await channel.send({
            content: "@everyone",
            embeds: [endingSoonEmbed]
          });
        } catch (error) {
          console.error("gxstart ending soon error:", error);
        }
      }, template.durationMs - endingSoonMs);
    }

    setTimeout(async () => {
      try {
        const freshRun = await GiveawayRun.findById(run._id);
        if (!freshRun || freshRun.status !== "running") return;

        const fetchedMessage = await channel.messages.fetch(existingMessage.id).catch(() => null);

        if (!fetchedMessage) {
          freshRun.status = "ended";
          await freshRun.save();
          await channel.send("❌ Giveaway message could not be found when ending the giveaway.");
          return;
        }

        const reaction = fetchedMessage.reactions.cache.get("🎉");

        if (!reaction) {
          freshRun.status = "ended";
          await freshRun.save();

          await channel.send({
            embeds: [buildNoParticipantsEmbed(template.prize)]
          });
          return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot);

        if (participants.size === 0) {
          freshRun.status = "ended";
          await freshRun.save();

          await channel.send({
            embeds: [buildNoParticipantsEmbed(template.prize)]
          });
          return;
        }

        const participantArray = [...participants.values()];
        const winnerCount = Math.min(template.winnerCount, participantArray.length);
        const winners = [];

        while (winners.length < winnerCount) {
          const randomUser =
            participantArray[Math.floor(Math.random() * participantArray.length)];

          if (!winners.find(user => user.id === randomUser.id)) {
            winners.push(randomUser);
          }
        }

        freshRun.status = "ended";
        freshRun.winnerIds = winners.map(user => user.id);
        freshRun.participantIds = participantArray.map(user => user.id);
        await freshRun.save();

        await channel.send({
          content: "@everyone",
          embeds: [buildWinnersEmbed(template.prize, winners)]
        });

        for (const winner of winners) {
          await winner.send(template.winnerDmMessage).catch(() => null);
        }
      } catch (error) {
        console.error("gxstart end error:", error);
        await channel.send("❌ Something went wrong while ending the giveaway.").catch(() => null);
      }
    }, template.durationMs);
  }
};
