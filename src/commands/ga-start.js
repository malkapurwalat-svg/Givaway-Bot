const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-start")
    .setDescription("Start a giveaway using a saved token.")
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

    const messageContent = `${template.announcementMessage}\n\n🎉 React with 🎉 to enter!\n🏆 Prize: ${template.prize}`;

    const giveawayMessage = await channel.send({
      content: messageContent
    });

    await giveawayMessage.react("🎉");

    await interaction.reply({
      content: `✅ Giveaway started in <#${channel.id}> with token \`${token}\`.`,
      ephemeral: true
    });

    setTimeout(async () => {
      try {
        const fetchedMessage = await channel.messages.fetch(giveawayMessage.id).catch(() => null);

        if (!fetchedMessage) {
          await channel.send("❌ Giveaway message could not be found when ending the giveaway.");
          return;
        }

        const reaction = fetchedMessage.reactions.cache.get("🎉");

        if (!reaction) {
          await channel.send(`❌ Giveaway ended. No one entered.\n🎁 Prize: ${template.prize}`);
          return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot);

        if (participants.size === 0) {
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

        await channel.send({
          content: `🎉 **Giveaway Ended!**\n🏆 Winner(s): ${winners.map(user => `<@${user.id}>`).join(", ")}\n🎁 Prize: ${template.prize}`
        });

        for (const winner of winners) {
          await winner.send(template.winnerDmMessage).catch(() => null);
        }

        for (const participant of participantArray) {
          if (!winners.find(winner => winner.id === participant.id)) {
            await participant.send(template.participantDmMessage).catch(() => null);
          }
        }
      } catch (error) {
        console.error("ga-start end error:", error);
        await channel.send("❌ Something went wrong while ending the giveaway.").catch(() => null);
      }
    }, template.durationMs);
  }
};
