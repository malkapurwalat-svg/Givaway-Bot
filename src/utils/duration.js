const ms = require("ms");

function parseDuration(input) {
  const value = ms(input);

  if (!value || value < 1000) {
    throw new Error("Invalid duration");
  }

  return value;
}

function normalizeDurationInput(input) {
  return String(input).trim().replace(/\s+/g, "");
}

function parseClaimTime(input) {
  const raw = String(input || "").trim();

  if (!raw) {
    return 12 * 60 * 60 * 1000;
  }

  if (raw === "-") {
    return -1;
  }

  const normalized = normalizeDurationInput(raw);
  const value = ms(normalized);

  if (!value || value < 60 * 60 * 1000) {
    throw new Error("Claim time must be at least 1 hour, or use - for forever.");
  }

  return value;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
}

function formatDurationDetailed(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);

  return parts.join(", ");
}

module.exports = {
  parseDuration,
  parseClaimTime,
  formatDuration,
  formatDurationDetailed
};
