const mongoose = require("mongoose");

const giveawayRunSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true
    },
    templateToken: {
      type: String,
      required: true,
      index: true
    },
    prize: {
      type: String,
      required: true
    },
    durationMs: {
      type: Number,
      required: true
    },
    winnerCount: {
      type: Number,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    messageId: {
      type: String,
      required: true
    },
    statusMessageId: {
      type: String,
      default: null
    },
    hostUserId: {
      type: String,
      default: ""
    },
    winnerDmMessage: {
      type: String,
      required: true
    },
    participantDmMessage: {
      type: String,
      required: true
    },
    customEndingMessage1: {
      type: String,
      default: ""
    },
    customEndingMessage2: {
      type: String,
      default: ""
    },
    customWinnerAnnouncement: {
      type: String,
      default: ""
    },
    participants: {
      type: [String],
      default: []
    },
    winnerIds: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["running", "ended", "cancelled"],
      default: "running",
      index: true
    },
    startedAt: {
      type: Number,
      required: true
    },
    endsAt: {
      type: Number,
      required: true
    },
    warning1Sent: {
      type: Boolean,
      default: false
    },
    warning2Sent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiveawayRun", giveawayRunSchema);
