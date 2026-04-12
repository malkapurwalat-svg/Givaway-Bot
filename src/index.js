require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials
} = require("discord.js");

const GiveawayRun = require("./models/GiveawayRun");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User
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

// DM participant instantly when they react
client.on("messageReactionAdd", async (reaction, user) => {
  try {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch().catch(() => null);
    if (!reaction.message) return;
    if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

    if (reaction.emoji.name !== "🎉") return;

    const run = await GiveawayRun.findOne({
      messageId: reaction.message.id,
      status: "running"
    });

    if (!run) return;

    if (run.participantIds.includes(user.id)) return;

    run.participantIds.push(user.id);
    await run.save();

    await user.send(run.participantDmMessage).catch(() => null);
  } catch (error) {
    console.error("messageReactionAdd error:", error);
  }
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

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Error executing command",
        ephemeral: true
      }).catch(() => null);
    } else {
      await interaction.reply({
        content: "❌ Error executing command",
        ephemeral: true
      }).catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
