const ms = require("ms");

function parseDuration(input) {
  const value = ms(input);

  if (!value || value < 60_000) {
    throw new Error("Duration must be at least 1 minute. Example: 24h");
  }

  return value;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);

  return parts.length ? parts.join(" ") : "0m";
}

module.exports = {
  parseDuration,
  formatDuration
};
