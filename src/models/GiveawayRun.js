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
      required: true
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
    status: {
      type: String,
      enum: ["scheduled", "running", "ended", "cancelled"],
      default: "scheduled"
    },
    startedAt: {
      type: Date,
      default: null
    },
    endsAt: {
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
