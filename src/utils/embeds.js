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

function getAnimatedStyle(percentLeft, frame) {
  if (percentLeft > 0.75) {
    return {
      title: frame % 2 === 0 ? "🟢 GiveX Live Giveaway" : "✨ GiveX Live Giveaway",
      status: "RUNNING STRONG"
    };
  }

  if (percentLeft > 0.4) {
    return {
      title: frame % 2 === 0 ? "🟡 GiveX Live Giveaway" : "⚡ GiveX Live Giveaway",
      status: "MIDWAY"
    };
  }

  if (percentLeft > 0.15) {
    return {
      title: frame % 2 === 0 ? "🟠 GiveX Live Giveaway" : "🔥 GiveX Live Giveaway",
      status: "ENDING SOON"
    };
  }

  return {
    title: frame % 2 === 0 ? "🔴 GiveX Live Giveaway" : "🚨 GiveX Live Giveaway",
    status: "FINAL MOMENTS"
  };
}

function buildProgressBar(percentLeft) {
  const total = 10;
  const filled = Math.max(0, Math.min(total, Math.round(percentLeft * total)));
  const empty = total - filled;
  return `█`.repeat(filled) + `░`.repeat(empty);
}

function buildStatusEmbed(run) {
  const now = Date.now();
  const endMs = new Date(run.endsAt).getTime();
  const startMs = new Date(run.startedAt).getTime();

  const totalMs = Math.max(1, endMs - startMs);
  const remainingMs = Math.max(0, endMs - now);
  const percentLeft = remainingMs / totalMs;

  const frame = Math.floor(now / (2 * 60 * 1000));
  const style = getAnimatedStyle(percentLeft, frame);
  const progress = buildProgressBar(percentLeft);

  const endUnix = Math.floor(endMs / 1000);

  return new EmbedBuilder()
    .setTitle(style.title)
    .setDescription("Your giveaway is active and being tracked live.")
    .addFields(
      {
        name: "🎁 Prize",
        value: run.prize,
        inline: false
      },
      {
        name: "🏆 Winners",
        value: String(run.winnerCount),
        inline: true
      },
      {
        name: "📌 Status",
        value: style.status,
        inline: true
      },
      {
        name: "⏳ Time Remaining",
        value: run.status === "running" ? formatDurationDetailed(remainingMs) : "Ended",
        inline: false
      },
      {
        name: "📊 Progress",
        value: `${progress} ${Math.round(percentLeft * 100)}%`,
        inline: false
      },
      {
        name: "🕒 Ends At",
        value: `<t:${endUnix}:F>`,
        inline: false
      }
    )
    .setFooter({ text: "This panel updates automatically every 2 minutes." });
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
    )
    .setFooter({ text: "Congratulations to the winners!" });
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
    .setDescription("A winner has been chosen by the management team.")
    .addFields(
      {
        name: "🏆 Winner",
        value: `<@${chosenUser.id}>`
      },
      {
        name: "🎁 Prize",
        value: prize
      }
    );
}

module.exports = {
  buildTemplatePreviewEmbed,
  buildStatusEmbed,
  buildWinnersEmbed,
  buildNoParticipantsEmbed,
  buildManualPickEmbed
};
