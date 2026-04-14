const mongoose = require("mongoose");

const giveawayTemplateSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true
    },
    token: {
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
      required: true,
      default: 1
    },
    channelId: {
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
    createdBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

giveawayTemplateSchema.index({ guildId: 1, token: 1 }, { unique: true });

module.exports = mongoose.model("GiveawayTemplate", giveawayTemplateSchema);
