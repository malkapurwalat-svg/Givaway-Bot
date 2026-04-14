require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  Client,
  Collection,
  GatewayIntentBits
} = require("discord.js");

const GiveawayRun = require("./models/GiveawayRun");
const { buildLiveEmbed } = require("./utils/embeds");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, client);
      return;
    }

    if (interaction.isButton()) {
      if (!interaction.customId.startsWith("join_")) return;

      const runId = interaction.customId.split("_")[1];
      const run = await GiveawayRun.findById(runId);

      if (!run || run.status !== "running") {
        return interaction.reply({
          content: "❌ This giveaway is not active anymore.",
          ephemeral: true
        });
      }

      if (run.participants.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ You already joined this giveaway.",
          ephemeral: true
        });
      }

      run.participants.push(interaction.user.id);
      await run.save();

      const channel = await client.channels.fetch(run.channelId).catch(() => null);
      if (channel && channel.isTextBased() && run.statusMessageId) {
        const statusMessage = await channel.messages.fetch(run.statusMessageId).catch(() => null);
        if (statusMessage) {
          await statusMessage.edit({
            embeds: [buildLiveEmbed(run)]
          }).catch(() => null);
        }
      }

      await interaction.user.send(run.participantDmMessage).catch(() => null);

      return interaction.reply({
        content: "✅ You joined the giveaway!",
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Something went wrong.",
          ephemeral: true
        }).catch(() => null);
      } else {
        await interaction.reply({
          content: "❌ Something went wrong.",
          ephemeral: true
        }).catch(() => null);
      }
    }
  }
});

async function start() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ Connected to MongoDB");
  await client.login(process.env.DISCORD_TOKEN);
}

start().catch((error) => {
  console.error("Startup error:", error);
  process.exit(1);
});

module.exports = client;
