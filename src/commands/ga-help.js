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
          value: "Start a giveaway from a saved token."
        },
        {
          name: "/ga-repeat",
          value: "Repeat a saved giveaway using the same token settings."
        },
        {
          name: "/ga-delete",
          value: "Delete a saved giveaway template and free that token again."
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
