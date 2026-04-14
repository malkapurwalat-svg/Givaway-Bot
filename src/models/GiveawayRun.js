const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  guildId: String,
  templateToken: String,
  prize: String,
  durationMs: Number,
  winnerCount: Number,

  channelId: String,
  messageId: String,
  statusMessageId: String,

  winnerDmMessage: String,
  participantDmMessage: String,

  customEndingMessage1: String,
  customEndingMessage2: String,
  customWinnerAnnouncement: String,

  participants: {
    type: [String],
    default: []
  },

  status: {
    type: String,
    default: "running"
  },

  startedAt: Date,
  endsAt: Date
});

module.exports = mongoose.model("GiveawayRun", schema);
