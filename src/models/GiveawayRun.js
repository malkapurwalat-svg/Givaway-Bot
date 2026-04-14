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
      required: true,
      default: 1
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
      required: true
    },
    announcementMessage: {
      type: String,
      required: true
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
    warning1Sent: {
      type: Boolean,
      default: false
    },
    warning2Sent: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["running", "ended", "cancelled"],
      default: "running",
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endsAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      default: null
    },
    winnerIds: {
      type: [String],
      default: []
    },
    participantIds: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiveawayRun", giveawayRunSchema);
