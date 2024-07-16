require("dotenv").config();
const { REST, Routes } = require("discord.js");

const discordClientId = process.env.DC_APP_ID;
const discordToken = process.env.DC_APP_TOKEN;

const rest = new REST().setToken(discordToken);

async function clearAllCommands(rest, clientId) {
    // For guild-based commands
    /*rest.put(Routes.applicationGuildCommands(clientId, discordServerId), { body: [] })
        .then(() => console.log("Successfully deleted all guild commands."))
        .catch(console.error);*/

    // For global commands
    rest.put(Routes.applicationCommands(clientId), { body: [] })
        .then(() => console.log("Successfully deleted all application commands."))
        .catch(console.error);
}

clearAllCommands(rest, discordClientId);