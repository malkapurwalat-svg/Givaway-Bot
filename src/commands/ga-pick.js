const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayRun = require("../models/GiveawayRun");
const { pickWinnerManually } = require("../utils/giveawayRuntime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxpick")
    .setDescription("Manually pick a winner for a running giveaway")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to pick as winner").setRequired(true)
    ),

  async execute(interaction, client) {
    if (!(await ensureAdmin(interaction))) return;

    const messageId = interaction.options.getString("message_id");
    const user = interaction.options.getUser("user");

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

    const result = await pickWinnerManually(client, run._id, user.id);

    await interaction.reply({
      content: result.message,
      ephemeral: !result.ok
    });
  }
};
