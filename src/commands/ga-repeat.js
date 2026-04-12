const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");
const GiveawayRun = require("../models/GiveawayRun");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-repeat")
    .setDescription("Repeat a saved giveaway using its token.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName("token")
        .setDescription("Saved giveaway token")
        .setRequired(true)
    ),

  async execute(interaction, client) {
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

    const channel = await client.channels.fetch(template.channelId).catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: "❌ Giveaway channel not found or not usable.",
        ephemeral: true
      });
    }

    const giveawayMessage = await channel.send({
      content: `${template.announcementMessage}\n\n🎉 React with 🎉 to enter!\n🏆 Prize: ${template.prize}`
    });

    await giveawayMessage.react("🎉");

    const run = await GiveawayRun.create({
      guildId: interaction.guild.id,
      templateToken: template.token,
      prize: template.prize,
      durationMs: template.durationMs,
      winnerCount: template.winnerCount,
      channelId: template.channelId,
      messageId: giveawayMessage.id,
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
      content: `✅ Giveaway repeated in <#${channel.id}> with token \`${token}\`.`,
      ephemeral: true
    });

    setTimeout(async () => {
      try {
        const freshRun = await GiveawayRun.findById(run._id);
        if (!freshRun || freshRun.status !== "running") return;

        const fetchedMessage = await channel.messages.fetch(giveawayMessage.id).catch(() => null);

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
          await channel.send(`❌ Giveaway ended. No one entered.\n🎁 Prize: ${template.prize}`);
          return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot);

        if (participants.size === 0) {
          freshRun.status = "ended";
          await freshRun.save();
          await channel.send(`❌ Giveaway ended. No valid participants.\n🎁 Prize: ${template.prize}`);
          return;
        }

        const participantArray = [...participants.values()];
        const winnerCount = Math.min(template.winnerCount, participantArray.length);
        const winners = [];

        while (winners.length < winnerCount) {
          const randomUser = participantArray[Math.floor(Math.random() * participantArray.length)];
          if (!winners.find(user => user.id === randomUser.id)) {
            winners.push(randomUser);
          }
        }

        freshRun.status = "ended";
        freshRun.winnerIds = winners.map(user => user.id);
        freshRun.participantIds = participantArray.map(user => user.id);
        await freshRun.save();

        await channel.send({
          content: `🎉 **Giveaway Ended!**\n🏆 Winner(s): ${winners.map(user => `<@${user.id}>`).join(", ")}\n🎁 Prize: ${template.prize}`
        });

        for (const winner of winners) {
          await winner.send(template.winnerDmMessage).catch(() => null);
        }
      } catch (error) {
        console.error("ga-repeat end error:", error);
        await channel.send("❌ Something went wrong while ending the giveaway.").catch(() => null);
      }
    }, template.durationMs);
  }
};
