const GiveawayRun = require("../models/GiveawayRun");
const { buildLiveEmbed } = require("./embeds");

function startUpdater(client, runId) {
  const interval = setInterval(async () => {
    const run = await GiveawayRun.findById(runId);
    if (!run || run.status !== "running") return clearInterval(interval);

    const channel = await client.channels.fetch(run.channelId);
    const msg = await channel.messages.fetch(run.statusMessageId);

    await msg.edit({
      embeds: [buildLiveEmbed(run)]
    }).catch(() => null);
  }, 5000);
}

async function endGiveaway(client, runId) {
  const run = await GiveawayRun.findById(runId);
  if (!run) return;

  const channel = await client.channels.fetch(run.channelId);

  if (run.participants.length === 0) {
    await channel.send("❌ No participants.");
    return;
  }

  const shuffled = run.participants.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, run.winnerCount);

  await channel.send(
    `🎉 Winners: ${winners.map(id => `<@${id}>`).join(", ")}`
  );

  run.status = "ended";
  await run.save();
}

function schedule(client, run) {
  startUpdater(client, run._id);

  setTimeout(() => {
    endGiveaway(client, run._id);
  }, run.durationMs);
}

module.exports = {
  schedule
};
