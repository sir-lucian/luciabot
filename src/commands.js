const { Routes } = require("discord.js");

async function clearAllCommands(rest, clientId, discordServerId) {
    // For guild-based commands
    rest.put(Routes.applicationGuildCommands(clientId, discordServerId), { body: [] })
        .then(() => console.log("Successfully deleted all guild commands."))
        .catch(console.error);

    // For global commands
    rest.put(Routes.applicationCommands(clientId), { body: [] })
        .then(() =>
            console.log("Successfully deleted all application commands.")
        )
        .catch(console.error);
}