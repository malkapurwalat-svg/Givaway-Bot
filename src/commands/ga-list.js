const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { ensureAdmin } = require("../utils/adminOnly");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("REPLACE_NAME")
    .setDescription("Temporary placeholder command.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!(await ensureAdmin(interaction))) return;

    await interaction.reply({
      content: "⚠️ This command is not built yet.",
      ephemeral: true
    });
  }
};
