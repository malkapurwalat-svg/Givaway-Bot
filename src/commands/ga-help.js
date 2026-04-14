const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gxhelp")
    .setDescription("Show giveaway bot help and command usage")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("📖 GiveX Help")
      .setDescription("Here are the main GiveX commands.")
      .addFields(
        {
          name: "/gxcreate",
          value: "Create and save a giveaway template."
        },
        {
          name: "/gxedit",
          value: "Edit a saved giveaway template using the same token."
        },
        {
          name: "/gxview",
          value: "View the details of a saved giveaway token."
        },
        {
          name: "/gxlist",
          value: "List all saved giveaway templates."
        },
        {
          name: "/gxstart",
          value: "Start a giveaway on your own posted message using token + message ID."
        },
        {
          name: "/gxrepeat",
          value: "Repeat a saved giveaway on your own posted message."
        },
        {
          name: "/gxdelete",
          value: "Delete a saved giveaway template and free that token."
        },
        {
          name: "/gxend",
          value: "End a running giveaway early."
        },
        {
          name: "/gxeroll",
          value: "Reroll a completed giveaway."
        },
        {
          name: "/gxpick",
          value: "Manually choose a winner from the people who reacted."
        },
        {
          name: "/gxhelp",
          value: "Show this help menu."
        }
      )
      .setFooter({ text: "Template placeholders supported in start/repeat: {time} {prize} {winners} {token} {winner_mentions}" });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
