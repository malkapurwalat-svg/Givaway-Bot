require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  Client,
  Collection,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const GiveawayRun = require("./models/GiveawayRun");
const GuildConfig = require("./models/GuildConfig");
const { buildLiveEmbed } = require("./utils/embeds");
const { registerCommands } = require("./deploy-commands");
const { initializeRecoveryEngine } = require("./utils/runtime");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
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

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initializeRecoveryEngine(client);
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

      if (!run) {
        return interaction.reply({
          content: "❌ Giveaway not found.",
          ephemeral: true
        });
      }

      if (run.status !== "running") {
        return interaction.reply({
          content: "❌ This giveaway is not active anymore.",
          ephemeral: true
        });
      }

      if (run.isPaused) {
        return interaction.reply({
          content: "❌ This giveaway is paused right now.",
          ephemeral: true
        });
      }

      if (run.joinedUserIds.includes(interaction.user.id)) {
        return interaction.reply({
          content: "❌ You already joined this giveaway.",
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) {
        return interaction.reply({
          content: "❌ Could not verify your membership.",
          ephemeral: true
        });
      }

      if (!run.staffParticipation) {
        const isStaff =
          member.permissions.has(PermissionsBitField.Flags.Administrator) ||
          member.permissions.has(PermissionsBitField.Flags.ManageGuild);

        if (isStaff) {
          if (!run.blockedUsers.includes(interaction.user.id)) {
            run.blockedUsers.push(interaction.user.id);
            await run.save();
          }

          return interaction.reply({
            content: "❌ Staff members are not allowed to participate in this giveaway.",
            ephemeral: true
          });
        }
      }

      if (run.requiredRoleId && !member.roles.cache.has(run.requiredRoleId)) {
        if (!run.blockedUsers.includes(interaction.user.id)) {
          run.blockedUsers.push(interaction.user.id);
          await run.save();
        }

        return interaction.reply({
          content: "❌ You do not have the required role for this giveaway.",
          ephemeral: true
        });
      }

      const minAgeDays = typeof run.minAccountAgeDays === "number" ? run.minAccountAgeDays : 3;
      if (minAgeDays > 0) {
        const accountAgeMs = Date.now() - interaction.user.createdTimestamp;
        const requiredMs = minAgeDays * 24 * 60 * 60 * 1000;

        if (accountAgeMs < requiredMs) {
          if (!run.blockedUsers.includes(interaction.user.id)) {
            run.blockedUsers.push(interaction.user.id);
            await run.save();
          }

          return interaction.reply({
            content: `❌ Your account must be at least ${minAgeDays} day(s) old to join this giveaway.`,
            ephemeral: true
          });
        }
      }

      const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
      let entriesToAdd = 1;

      if (guildConfig?.bonusEntryRoles?.length) {
        for (const config of guildConfig.bonusEntryRoles) {
          if (member.roles.cache.has(config.roleId)) {
            entriesToAdd = Math.max(entriesToAdd, config.entries);
          }
        }
      }

      run.joinedUserIds.push(interaction.user.id);

      for (let i = 0; i < entriesToAdd; i++) {
        run.participants.push(interaction.user.id);
      }

      await run.save();

      const channel = await client.channels.fetch(run.channelId).catch(() => null);
      if (channel && channel.isTextBased() && run.statusMessageId) {
        const statusMessage = await channel.messages.fetch(run.statusMessageId).catch(() => null);
        if (statusMessage) {
          await statusMessage.edit({
            embeds: [buildLiveEmbed(run)],
            components: statusMessage.components
          }).catch(() => null);
        }
      }

      await interaction.user.send(run.participantDmMessage).catch(() => null);

      return interaction.reply({
        content: `✅ You joined the giveaway! Your entry count for this giveaway is **${entriesToAdd}**.`,
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

  await registerCommands();

  await client.login(process.env.DISCORD_TOKEN);
}

start().catch((error) => {
  console.error("Startup error:", error);
  process.exit(1);
});

module.exports = client;
