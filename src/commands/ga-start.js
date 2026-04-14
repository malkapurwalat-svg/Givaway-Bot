const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const GiveawayTemplate = require("../models/GiveawayTemplate");
const GiveawayRun = require("../models/GiveawayRun");
const { buildLiveEmbed } = require("../utils/embeds");
const { schedule } = require("../utils/runtime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxstart")
    .addStringOption(o => o.setName("token").setRequired(true))
    .addStringOption(o => o.setName("message_id").setRequired(true)),

  async execute(interaction, client) {
    const token = interaction.options.getString("token");
    const messageId = interaction.options.getString("message_id");

    const template = await GiveawayTemplate.findOne({
      guildId: interaction.guild.id,
      token
    });

    const channel = await client.channels.fetch(template.channelId);
    const msg = await channel.messages.fetch(messageId);

    const run = await GiveawayRun.create({
      guildId: interaction.guild.id,
      templateToken: token,
      prize: template.prize,
      durationMs: template.durationMs,
      winnerCount: template.winnerCount,
      channelId: channel.id,
      messageId: msg.id,
      startedAt: Date.now(),
      endsAt: Date.now() + template.durationMs,
      participantDmMessage: template.participantDmMessage,
      winnerDmMessage: template.winnerDmMessage
    });

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_${run._id}`)
        .setLabel("🎉 Join Giveaway")
        .setStyle(ButtonStyle.Success)
    );

    const statusMsg = await channel.send({
      embeds: [buildLiveEmbed(run)],
      components: [button]
    });

    run.statusMessageId = statusMsg.id;
    await run.save();

    await interaction.reply({
      content: "✅ Giveaway started",
      ephemeral: true
    });

    schedule(client, run);
  }
};
