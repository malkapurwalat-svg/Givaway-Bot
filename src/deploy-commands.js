require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      if (!command.data) {
        console.log(`Skipping ${file} because it has no data`);
        continue;
      }

      commands.push(command.data.toJSON());
      console.log(`Loaded command: ${command.data.name}`);
    } catch (error) {
      console.error(`Failed loading ${file}:`, error);
    }
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  console.log(`🔄 Registering ${commands.length} guild slash commands...`);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ Slash commands registered successfully.");
}

module.exports = { registerCommands };

if (require.main === module) {
  registerCommands().catch(error => {
    console.error("❌ Deploy error:", error);
    process.exit(1);
  });
}
