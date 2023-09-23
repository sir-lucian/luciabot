const { Client, IntentsBitField, Routes } = require("discord.js");

/* Initialize Lucia Discord App */
const luciaClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

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
