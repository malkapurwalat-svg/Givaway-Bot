const { EmbedBuilder } = require("discord.js");

function progressBar(percent) {
  const total = 10;
  const filled = Math.round(percent * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

function format(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function buildLiveEmbed(run) {
  const now = Date.now();
  const total = run.endsAt - run.startedAt;
  const left = Math.max(0, run.endsAt - now);

  const percent = left / total;

  return new EmbedBuilder()
    .setTitle("🎉 GiveX Live Giveaway")
    .addFields(
      { name: "🎁 Prize", value: run.prize },
      { name: "🏆 Winners", value: String(run.winnerCount), inline: true },
      { name: "👥 Participants", value: String(run.participants.length), inline: true },
      { name: "⏳ Time Left", value: format(left) },
      { name: "📊 Progress", value: progressBar(percent) }
    )
    .setFooter({ text: "Updates every 5 seconds" });
}

module.exports = {
  buildLiveEmbed
};
