const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayRun = require("../models/GiveawayRun");
const { buildWinnersEmbed, buildNoParticipantsEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxend")
    .setDescription("End a running giveaway early")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt => opt.setName("message_id").setDescription("Announcement message ID").setRequired(true)),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const messageId = interaction.options.getString("message_id");

    const run = await GiveawayRun.findOne({
      guildId: interaction.guild.id,
      messageId,
      status: "running"
    });

    if (!run) {
      return interaction.reply({
        content: "❌ No running giveaway found with that message ID.",
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

    if (!run.participants.length) {
      run.status = "ended";
      await run.save();

      await channel.send({
        embeds: [buildNoParticipantsEmbed(run.prize)]
      }).catch(() => null);

      return interaction.reply({
        content: "✅ Giveaway ended with no participants.",
        ephemeral: true
      });
    }

    const pool = [...run.participants];
    const winners = [];

    while (winners.length < Math.min(run.winnerCount, pool.length)) {
      const randomId = pool[Math.floor(Math.random() * pool.length)];
      if (!winners.includes(randomId)) winners.push(randomId);
    }

    const users = [];
    for (const id of winners) {
      const user = await client.users.fetch(id).catch(() => null);
      if (user) users.push(user);
    }

    run.status = "ended";
    run.winnerIds = winners;
    await run.save();

    await channel.send({
      content: "@everyone",
      embeds: [buildWinnersEmbed(run.prize, users)]
    }).catch(() => null);

    for (const user of users) {
      await user.send(run.winnerDmMessage).catch(() => null);
    }

    await interaction.reply({
      content: "✅ Giveaway ended successfully.",
      ephemeral: true
    });
  }
};
