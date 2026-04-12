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
          value: "Create and save a giveaway template with a unique token."
        },
        {
          name: "/gxview",
          value: "View the full saved details of one giveaway token."
        },
        {
          name: "/gxlist",
          value: "List all saved giveaway templates."
        },
        {
          name: "/gxstart",
          value: "Start a giveaway from a saved token."
        },
        {
          name: "/gxrepeat",
          value: "Repeat a saved giveaway using the same token settings."
        },
        {
          name: "/gxdelete",
          value: "Delete a saved giveaway template and free that token again."
        },
        {
          name: "/gxend",
          value: "End a running giveaway early."
        },
        {
          name: "/gxeroll",
          value: "Pick a new winner for a completed giveaway."
        },
        {
          name: "/gxhelp",
          value: "Show this help menu."
        }
      )
      .setFooter({ text: "Only you can see this help menu." });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
