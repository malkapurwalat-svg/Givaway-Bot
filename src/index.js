require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Mongo connect
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("✅ Connected to MongoDB");
});

// Ready
client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Interaction
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Error executing command",
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
