function parseDuration(input) {
  if (!input) throw new Error("Duration is required.");

  const regex = /(\d+)([smhd])/gi;
  let total = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === "s") total += value * 1000;
    if (unit === "m") total += value * 60 * 1000;
    if (unit === "h") total += value * 60 * 60 * 1000;
    if (unit === "d") total += value * 24 * 60 * 60 * 1000;
  }

  if (total <= 0) throw new Error("Invalid duration format.");
  return total;
}

function parseClaimTime(input) {
  if (!input || input.trim() === "") return 12 * 60 * 60 * 1000; // default 12h

  if (input.trim() === "-") return -1; // forever

  return parseDuration(input);
}

function formatDurationDetailed(ms) {
  if (ms <= 0) return "0 seconds";

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const parts = [];
  if (d) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
  if (m) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
  if (sec) parts.push(`${sec} second${sec !== 1 ? "s" : ""}`);

  return parts.join(", ");
}

module.exports = {
  parseDuration,
  parseClaimTime,
  formatDurationDetailed
};
