require("dotenv").config();
const { REST, Routes } = require("discord.js");

const discordToken = process.env.DISCORD_TOKEN;
const discordChannel = process.env.DISCORD_CHANNEL_ID;

const rest = new REST().setToken(discordToken);

async function clearAllCommands(rest, clientId, discordServerId) {
    // For guild-based commands
    rest.put(Routes.applicationGuildCommands(clientId, discordServerId), { body: [] })
        .then(() => console.log("Successfully deleted all guild commands."))
        .catch(console.error);

    // For global commands
    rest.put(Routes.applicationCommands(clientId), { body: [] })
        .then(() => console.log("Successfully deleted all application commands."))
        .catch(console.error);
}

clearAllCommands(rest, discordToken, discordChannel);