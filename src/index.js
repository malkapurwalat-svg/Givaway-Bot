const mongoose = require("mongoose");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const { token, mongoUrl } = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

const commandFiles = [
  "ga-help",
  "ga-create",
  "ga-view",
  "ga-list",
  "ga-start",
  "ga-repeat",
  "ga-end",
  "ga-reroll"
];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
      return;
    }

    // Button handling will be added in phase 2
  } catch (error) {
    console.error("Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Something went wrong while running that command.",
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: "❌ Something went wrong while running that command.",
        ephemeral: true
      });
    }
  }
});

async function start() {
  await mongoose.connect(mongoUrl);
  console.log("✅ Connected to MongoDB");

  await client.login(token);
}

start().catch((error) => {
  console.error("Startup error:", error);
  process.exit(1);
});
