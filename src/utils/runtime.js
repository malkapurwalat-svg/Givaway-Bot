const GiveawayRun = require("../models/GiveawayRun");
const {
  buildLiveEmbed,
  buildWinnersEmbed,
  buildNoParticipantsEmbed,
  buildManualPickEmbed
} = require("./embeds");
const { formatDurationDetailed } = require("./duration");

function renderText(template, values) {
  if (!template || !template.trim()) return "";

  return template
    .replace(/\{time\}/gi, values.time ?? "")
    .replace(/\{prize\}/gi, values.prize ?? "")
    .replace(/\{winners\}/gi, String(values.winners ?? ""))
    .replace(/\{token\}/gi, values.token ?? "")
    .replace(/\{winner_mentions\}/gi, values.winnerMentions ?? "");
}

async function updateLiveMessage(client, runId) {
  const run = await GiveawayRun.findById(runId);
  if (!run || !run.statusMessageId) return false;

  const channel = await client.channels.fetch(run.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return false;

  const msg = await channel.messages.fetch(run.statusMessageId).catch(() => null);
  if (!msg) return false;

  await msg.edit({
    embeds: [buildLiveEmbed(run)]
  }).catch(() => null);

  return run.status === "running";
}

async function sendWarning(client, runId, type) {
  const run = await GiveawayRun.findById(runId);
  if (!run || run.status !== "running") return;

  if (type === 1 && run.warning1Sent) return;
  if (type === 2 && run.warning2Sent) return;

  const channel = await client.channels.fetch(run.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const remaining = Math.max(0, run.endsAt - Date.now());

  const defaultText =
    type === 1
      ? `@everyone ⏳ Giveaway for **{prize}** ends in **{time}**!`
      : `@everyone 🚨 FINAL CALL! Only **{time}** left for **{prize}**!`;

  const customText = type === 1 ? run.customEndingMessage1 : run.customEndingMessage2;
  const finalText = renderText(customText && customText.trim() ? customText : defaultText, {
    time: formatDurationDetailed(remaining),
    prize: run.prize,
    winners: run.winnerCount,
    token: run.templateToken,
    winnerMentions: ""
  });

  await channel.send({ content: finalText }).catch(() => null);

  if (type === 1) run.warning1Sent = true;
  if (type === 2) run.warning2Sent = true;
  await run.save();
}

async function sendWinnerAnnouncement(channel, run, winners) {
  const customText = run.customWinnerAnnouncement?.trim();

  if (customText) {
    const rendered = renderText(customText, {
      time: "0 seconds",
      prize: run.prize,
      winners: run.winnerCount,
      token: run.templateToken,
      winnerMentions: winners.map(user => `<@${user.id}>`).join(", ")
    });

    await channel.send({ content: rendered }).catch(() => null);
    return;
  }

  await channel.send({
    content: "@everyone",
    embeds: [buildWinnersEmbed(run.prize, winners)]
  }).catch(() => null);
}

async function endGiveawayRandom(client, runId) {
  const run = await GiveawayRun.findById(runId);
  if (!run || run.status !== "running") return;

  const channel = await client.channels.fetch(run.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  if (!run.participants.length) {
    run.status = "ended";
    await run.save();

    await channel.send({
      embeds: [buildNoParticipantsEmbed(run.prize)]
    }).catch(() => null);

    await updateLiveMessage(client, run._id);
    return;
  }

  const pool = [...run.participants];
  const winners = [];

  while (winners.length < Math.min(run.winnerCount, pool.length)) {
    const randomId = pool[Math.floor(Math.random() * pool.length)];
    if (!winners.includes(randomId)) winners.push(randomId);
  }

  const winnerUsers = [];
  for (const id of winners) {
    const user = await client.users.fetch(id).catch(() => null);
    if (user) winnerUsers.push(user);
  }

  run.status = "ended";
  run.winnerIds = winners;
  await run.save();

  if (!winnerUsers.length) {
    await channel.send({
      embeds: [buildNoParticipantsEmbed(run.prize)]
    }).catch(() => null);
    await updateLiveMessage(client, run._id);
    return;
  }

  await sendWinnerAnnouncement(channel, run, winnerUsers);

  for (const user of winnerUsers) {
    await user.send(run.winnerDmMessage).catch(() => null);
  }

  await updateLiveMessage(client, run._id);
}

async function pickWinnerManually(client, runId, chosenUserId) {
  const run = await GiveawayRun.findById(runId);
  if (!run || run.status !== "running") {
    return { ok: false, message: "❌ No running giveaway found with that message ID." };
  }

  if (!run.participants.includes(chosenUserId)) {
    return { ok: false, message: "❌ That user did not join this giveaway." };
  }

  const channel = await client.channels.fetch(run.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return { ok: false, message: "❌ Giveaway channel not found." };
  }

  const chosenUser = await client.users.fetch(chosenUserId).catch(() => null);
  if (!chosenUser) {
    return { ok: false, message: "❌ User could not be fetched." };
  }

  run.status = "ended";
  run.winnerIds = [chosenUserId];
  await run.save();

  const customText = run.customWinnerAnnouncement?.trim();

  if (customText) {
    const rendered = renderText(customText, {
      time: "0 seconds",
      prize: run.prize,
      winners: run.winnerCount,
      token: run.templateToken,
      winnerMentions: `<@${chosenUser.id}>`
    });

    await channel.send({ content: rendered }).catch(() => null);
  } else {
    await channel.send({
      content: "@everyone",
      embeds: [buildManualPickEmbed(run.prize, chosenUser)]
    }).catch(() => null);
  }

  await chosenUser.send(run.winnerDmMessage).catch(() => null);
  await updateLiveMessage(client, run._id);

  return { ok: true, message: `✅ Winner manually selected: <@${chosenUser.id}>` };
}

function scheduleGiveawayLifecycle(client, runId, durationMs) {
  const interval = setInterval(async () => {
    const keep = await updateLiveMessage(client, runId);
    if (!keep) clearInterval(interval);
  }, 5000);

  setTimeout(() => {
    sendWarning(client, runId, 1);
  }, Math.floor(durationMs / 2));

  setTimeout(() => {
    sendWarning(client, runId, 2);
  }, Math.floor(durationMs * 3 / 4));

  setTimeout(async () => {
    await endGiveawayRandom(client, runId);
    clearInterval(interval);
  }, durationMs);
}

module.exports = {
  scheduleGiveawayLifecycle,
  pickWinnerManually
};
