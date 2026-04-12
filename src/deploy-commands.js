const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config");

const commands = [
  require("./commands/ga-help").data.toJSON(),
  require("./commands/ga-create").data.toJSON(),
  require("./commands/ga-view").data.toJSON(),
  require("./commands/ga-list").data.toJSON(),
  require("./commands/ga-start").data.toJSON(),
  require("./commands/ga-repeat").data.toJSON(),
  require("./commands/ga-end").data.toJSON(),
  require("./commands/ga-reroll").data.toJSON()
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("🔄 Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
})();
