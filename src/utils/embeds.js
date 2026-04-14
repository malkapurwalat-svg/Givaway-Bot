const { EmbedBuilder } = require("discord.js");
const { formatDuration } = require("./duration");

function truncateBlock(text) {
  if (!text) return "*empty*";
  if (text.length <= 1024) return text;
  return `${text.slice(0, 1021)}...`;
}

function buildTemplatePreviewEmbed(data) {
  return new EmbedBuilder()
    .setTitle("🎁 Giveaway Preview")
    .setDescription("Please review the giveaway details below before continuing.")
    .addFields(
      { name: "Token", value: `\`${data.token}\``, inline: true },
      { name: "Prize", value: data.prize, inline: true },
      { name: "Winners", value: String(data.winnerCount), inline: true },
      { name: "Duration", value: formatDuration(data.durationMs), inline: true },
      { name: "Channel", value: `<#${data.channelId}>`, inline: true },
      { name: "Created By", value: `<@${data.createdBy}>`, inline: true },
      { name: "Announcement Message", value: truncateBlock(data.announcementMessage) },
      { name: "Winner DM", value: truncateBlock(data.winnerDmMessage) },
      { name: "Participant DM", value: truncateBlock(data.participantDmMessage) }
    )
    .setFooter({ text: "Only you can see this preview." });
}

function buildWinnersEmbed(prize, winners) {
  return new EmbedBuilder()
    .setTitle("🎉 Giveaway Ended!")
    .setDescription("The winners have been selected.")
    .addFields(
      {
        name: "Winner(s)",
        value: winners.map(user => `<@${user.id}>`).join("\n")
      },
      {
        name: "Prize",
        value: prize
      }
    )
    .setFooter({ text: "Congratulations to the winners!" });
}

function buildNoParticipantsEmbed(prize) {
  return new EmbedBuilder()
    .setTitle("❌ Giveaway Ended")
    .setDescription("No valid participants entered this giveaway.")
    .addFields({
      name: "Prize",
      value: prize
    });
}

function buildManualPickEmbed(prize, chosenUser) {
  return new EmbedBuilder()
    .setTitle("👑 Management Picked a Winner")
    .setDescription("A winner has been chosen by the management team.")
    .addFields(
      {
        name: "Winner",
        value: `<@${chosenUser.id}>`
      },
      {
        name: "Prize",
        value: prize
      }
    );
}

module.exports = {
  buildTemplatePreviewEmbed,
  buildWinnersEmbed,
  buildNoParticipantsEmbed,
  buildManualPickEmbed
};
