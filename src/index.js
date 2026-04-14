require("dotenv").config();

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const GiveawayRun = require("./src/models/GiveawayRun");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();


// ================= LOAD COMMANDS =================
const commandsPath = path.join(__dirname, "src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}


// ================= READY =================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});


// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {

  // ========= SLASH COMMANDS =========
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: "❌ Error", ephemeral: true });
      } else {
        interaction.reply({ content: "❌ Error", ephemeral: true });
      }
    }
  }


  // ========= BUTTON SYSTEM =========
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("join_")) {
      const runId = interaction.customId.split("_")[1];

      const run = await GiveawayRun.findById(runId);
      if (!run || run.status !== "running") {
        return interaction.reply({
          content: "❌ Giveaway not active",
          ephemeral: true
        });
      }

      // Already joined check
      if (run.participants.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ You already joined!",
          ephemeral: true
        });
      }

      // Add participant
      run.participants.push(interaction.user.id);
      await run.save();

      // DM user
      try {
        await interaction.user.send(run.participantDmMessage);
      } catch {}

      return interaction.reply({
        content: "✅ You joined the giveaway!",
        ephemeral: true
      });
    }

  }

});


// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log(err));


// ================= LOGIN =================
client.login(process.env.TOKEN);
