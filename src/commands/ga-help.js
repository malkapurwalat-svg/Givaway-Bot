const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ga-help")
    .setDescription("Show giveaway bot help and command usage.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("📖 Giveaway Bot Help")
      .setDescription("Here are the main giveaway commands.")
      .addFields(
        {
          name: "/ga-create",
          value: "Create and save a giveaway template with a unique token."
        },
        {
          name: "/ga-view",
          value: "View the full saved details of one giveaway token."
        },
        {
          name: "/ga-list",
          value: "List all saved giveaway templates."
        },
        {
          name: "/ga-start",
          value: "Start a giveaway from a saved token after preview confirmation."
        },
        {
          name: "/ga-repeat",
          value: "Repeat an old saved giveaway using the same token settings."
        },
        {
          name: "/ga-end",
          value: "End a running giveaway early."
        },
        {
          name: "/ga-reroll",
          value: "Pick a new winner for a completed giveaway."
        }
      )
      .setFooter({ text: "Only you can see this help menu." });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
