const { EmbedBuilder } = require("discord.js");
const { formatDuration, formatDurationDetailed } = require("./duration");

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

function progressBar(percent) {
  const total = 12;
  const filled = Math.max(0, Math.min(total, Math.round(percent * total)));
  return "█".repeat(filled) + "░".repeat(total - filled);
}

function getAnimatedTitle(percentLeft, frame) {
  if (percentLeft > 0.75) {
    return frame % 2 === 0 ? "🟢 GiveX Live Giveaway" : "✨ GiveX Live Giveaway";
  }
  if (percentLeft > 0.4) {
    return frame % 2 === 0 ? "🟡 GiveX Live Giveaway" : "⚡ GiveX Live Giveaway";
  }
  if (percentLeft > 0.15) {
    return frame % 2 === 0 ? "🟠 GiveX Live Giveaway" : "🔥 GiveX Live Giveaway";
  }
  return frame % 2 === 0 ? "🔴 GiveX Live Giveaway" : "🚨 GiveX Live Giveaway";
}

function getAnimatedStatus(percentLeft) {
  if (percentLeft > 0.75) return "RUNNING STRONG";
  if (percentLeft > 0.4) return "MIDWAY";
  if (percentLeft > 0.15) return "ENDING SOON";
  return "FINAL MOMENTS";
}

function buildLiveEmbed(run) {
  const now = Date.now();
  const total = Math.max(1, run.endsAt - run.startedAt);
  const left = Math.max(0, run.endsAt - now);
  const percentLeft = left / total;
  const frame = Math.floor(now / 5000);

  const endUnix = Math.floor(run.endsAt / 1000);

  return new EmbedBuilder()
    .setTitle(getAnimatedTitle(percentLeft, frame))
    .setDescription("Giveaway is active and updating live.")
    .addFields(
      { name: "🎁 Prize", value: run.prize, inline: false },
      { name: "🏆 Winners", value: String(run.winnerCount), inline: true },
      { name: "👥 Participants", value: String(run.participants.length), inline: true },
      { name: "📌 Status", value: getAnimatedStatus(percentLeft), inline: true },
      { name: "⏳ Time Remaining", value: run.status === "running" ? formatDurationDetailed(left) : "Ended", inline: false },
      { name: "📊 Progress", value: `${progressBar(percentLeft)} ${Math.round(percentLeft * 100)}%`, inline: false },
      { name: "🕒 Ends At", value: `<t:${endUnix}:F>`, inline: false }
    )
    .setFooter({ text: "Updates every 5 seconds" });
}

function buildWinnersEmbed(prize, winners) {
  return new EmbedBuilder()
    .setTitle("🎉 Giveaway Ended!")
    .setDescription("The winners have been selected.")
    .addFields(
      {
        name: "🏆 Winner(s)",
        value: winners.map(user => `<@${user.id}>`).join("\n")
      },
      {
        name: "🎁 Prize",
        value: prize
      }
    );
}

function buildNoParticipantsEmbed(prize) {
  return new EmbedBuilder()
    .setTitle("❌ Giveaway Ended")
    .setDescription("No valid participants entered this giveaway.")
    .addFields({
      name: "🎁 Prize",
      value: prize
    });
}

function buildManualPickEmbed(prize, chosenUser) {
  return new EmbedBuilder()
    .setTitle("👑 Management Picked a Winner")
    .setDescription("A winner has been chosen by management.")
    .addFields(
      { name: "🏆 Winner", value: `<@${chosenUser.id}>` },
      { name: "🎁 Prize", value: prize }
    );
}

module.exports = {
  buildTemplatePreviewEmbed,
  buildLiveEmbed,
  buildWinnersEmbed,
  buildNoParticipantsEmbed,
  buildManualPickEmbed
};
