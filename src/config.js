require("dotenv").config();

const required = ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID", "MONGO_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoUrl: process.env.MONGO_URL
};
