const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayRun = require("../models/GiveawayRun");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxeroll")
    .setDescription("Reroll a giveaway winner")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)
    ),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const messageId = interaction.options.getString("message_id");

    const run = await GiveawayRun.findOne({
      messageId,
      status: "ended"
    });

    if (!run) {
      return interaction.reply({
        content: "❌ No ended giveaway found with that message ID.",
        ephemeral: true
      });
    }

    const channel = await client.channels.fetch(run.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: "❌ Giveaway channel not found.",
        ephemeral: true
      });
    }

    const message = await channel.messages.fetch(run.messageId).catch(() => null);
    if (!message) {
      return interaction.reply({
        content: "❌ Giveaway message not found.",
        ephemeral: true
      });
    }

    const reaction = message.reactions.cache.get("🎉");

    if (!reaction) {
      return interaction.reply({
        content: "❌ No participants.",
        ephemeral: true
      });
    }

    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot);

    if (participants.size === 0) {
      return interaction.reply({
        content: "❌ No valid participants.",
        ephemeral: true
      });
    }

    const arr = [...participants.values()];
    const winner = arr[Math.floor(Math.random() * arr.length)];

    await channel.send(`🔄 **Rerolled Winner!**\n🏆 New Winner: <@${winner.id}>`);

    await winner.send(run.winnerDmMessage).catch(() => null);

    await interaction.reply({
      content: "✅ Rerolled successfully.",
      ephemeral: true
    });
  }
};
