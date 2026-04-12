const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { ensureAdmin } = require("../utils/adminOnly");
const GiveawayTemplate = require("../models/GiveawayTemplate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-delete")
    .setDescription("Delete a saved giveaway template and free its token.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option
        .setName("token")
        .setDescription("Saved giveaway token to delete")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!(await ensureAdmin(interaction))) return;

    const token = interaction.options.getString("token");

    const template = await GiveawayTemplate.findOne({
      guildId: interaction.guild.id,
      token
    });

    if (!template) {
      return interaction.reply({
        content: "❌ No saved giveaway template found with that token.",
        ephemeral: true
      });
    }

    await GiveawayTemplate.deleteOne({
      guildId: interaction.guild.id,
      token
    });

    await interaction.reply({
      content: `✅ Giveaway template with token \`${token}\` was deleted. That token is now free to use again.`,
      ephemeral: true
    });
  }
};
