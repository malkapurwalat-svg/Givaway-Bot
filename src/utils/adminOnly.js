const { PermissionFlagsBits } = require("discord.js");

async function ensureAdmin(interaction) {
  const member = interaction.member;

  const hasPermission =
    member &&
    member.permissions &&
    (
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)
    );

  if (hasPermission) return true;

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      content: "❌ This is an admin-only command.",
      ephemeral: true
    });
  } else {
    await interaction.followUp({
      content: "❌ This is an admin-only command.",
      ephemeral: true
    });
  }

  return false;
}

module.exports = { ensureAdmin };
