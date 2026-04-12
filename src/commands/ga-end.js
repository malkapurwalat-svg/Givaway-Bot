const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayRun = require("../models/GiveawayRun");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxend")
    .setDescription("End a running giveaway early")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)
    ),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const messageId = interaction.options.getString("message_id");

    const run = await GiveawayRun.findOne({
      messageId,
      status: "running"
    });

    if (!run) {
      return interaction.reply({
        content: "❌ No active giveaway found with that message ID.",
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
      run.status = "ended";
      await run.save();
      return interaction.reply({
        content: "❌ Giveaway message not found.",
        ephemeral: true
      });
    }

    const reaction = message.reactions.cache.get("🎉");

    if (!reaction) {
      run.status = "ended";
      await run.save();
      return interaction.reply({
        content: "❌ No participants.",
        ephemeral: true
      });
    }

    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot);

    if (participants.size === 0) {
      run.status = "ended";
      await run.save();
      return interaction.reply({
        content: "❌ No valid participants.",
        ephemeral: true
      });
    }

    const arr = [...participants.values()];
    const winnerCount = Math.min(run.winnerCount || 1, arr.length);
    const winners = [];

    while (winners.length < winnerCount) {
      const chosen = arr[Math.floor(Math.random() * arr.length)];
      if (!winners.find(w => w.id === chosen.id)) {
        winners.push(chosen);
      }
    }

    run.status = "ended";
    run.winnerIds = winners.map(w => w.id);
    run.participantIds = arr.map(u => u.id);
    await run.save();

    await channel.send(`⏹️ **Giveaway Ended Early!**\n🏆 Winner(s): ${winners.map(w => `<@${w.id}>`).join(", ")}\n🎁 Prize: ${run.prize}`);

    for (const winner of winners) {
      await winner.send(run.winnerDmMessage).catch(() => null);
    }

    await interaction.reply({
      content: "✅ Giveaway ended successfully.",
      ephemeral: true
    });
  }
};
