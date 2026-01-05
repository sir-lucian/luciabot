require("dotenv/config");

const { DiscordBot, DiscordStatus } = require("./services/discord/index.js");
const { Collection, Events, MessageFlags } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { TwitchBot } = require("./services/twitch/twitch-bot.js");

// const APP_ID = process.env.DC_APP_ID;
const APP_TOKEN = process.env.DC_APP_TOKEN;
const APP_LOG_CHANNEL = process.env.DC_APP_LOG;

const serversPath = path.join(__dirname, "services/discord/data");
const serverFiles = fs
    .readdirSync(serversPath)
    .filter((file) => file.startsWith("server-") && file.endsWith(".js"));

let servers = [];
let twitchIds = [];
let twitchNames = [];

for (const file of serverFiles) {
    const filePath = path.join(serversPath, file);
    const server = require(filePath);
    servers.push(server);
    if (server.alert && server.alert.twitch_id) {
        twitchIds.push(server.alert.twitch_id);
    }
    if (server.alert && server.alert.twitch_name) {
        twitchNames.push(server.alert.twitch_name);
    }
}

const luciaAppData = {
    log_channel: APP_LOG_CHANNEL,
    servers: servers,
};

const luciaApp = new DiscordBot(APP_TOKEN, "LuciaLatte", luciaAppData);
const twitchApp = new TwitchBot({
    appId: process.env.TWITCH_CLIENT_ID,
    appSecret: process.env.TWITCH_CLIENT_SECRET,
    refreshToken: process.env.TWITCH_REFRESH_TOKEN,
});
const start = luciaApp.initClient();

function handleButtonInteraction(interaction) {
    let handled = false;
    for (const server of servers) {
        if (server.roles) {
            const role = server.roles.find(r => r.id === interaction.customId);
            if (role) {
                luciaApp.doToggleRole(role.role || role.name, interaction);
                handled = true;
                break;
            }
        }
        if (server.actions) {
            const action = server.actions.find(a => a.id === interaction.customId);
            if (action) {
                luciaApp.doToggleRole(action.role, interaction);
                handled = true;
                break;
            }
        }
    }

    if (!handled) {
        interaction.reply({
            content: "Unknown button interaction.",
            flags: MessageFlags.Ephemeral,
        });
    }
}

async function initCommands() {
    luciaApp.commands = new Collection();
    const commandsPath = path.join(__dirname, "services/discord/commands");
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            luciaApp.commands.set(command.data.name, command);
        }
    }
}

async function initTwitch() {

    await twitchApp.refreshAccessToken(() => {
        luciaApp.log("Twitch access token refreshed");
    });

    await twitchApp.checkToken().then((valid) => {
        if (valid) {
            twitchApp.initMainListener({
                channelIds: twitchIds,
                channelNames: twitchNames,
                callbackOnline: (e) => {
                    const server = servers.find(s => s.alert && s.alert.twitch_id === e.broadcasterId);
                    if (server && server.alert && server.alert.message && server.alert.channel_id) {
                        luciaApp.announce(server.alert.channel_id, server.alert.message);
                    }
                },
            });
        } else {
            luciaApp.log("Twitch access token is invalid");
        }
    });
}

if (start) {
    luciaApp.on(Events.ClientReady, async () => {
        luciaApp.setStatus(DiscordStatus.Busy);
        await initCommands();
        await initTwitch();
        luciaApp.initRoleButtons();
        luciaApp.setStatus(DiscordStatus.StandBy);
        setInterval(async () => {
            luciaApp.log("Performing Twitch maintenance...");
            luciaApp.setStatus(DiscordStatus.Busy);
            try {
                const success = await twitchApp.performMaintenance({
                    channelIds: twitchIds,
                    channelNames: twitchNames,
                    oncallbackOnline: (e) => {
                        const server = servers.find(s => s.alert && s.alert.twitch_id === e.broadcasterId);
                        if (server && server.alert && server.alert.message && server.alert.channel_id) {
                            luciaApp.announce(server.alert.channel_id, server.alert.message);
                        }
                    },
                });
                if (success) {
                    luciaApp.log("Twitch maintenance completed successfully");
                    luciaApp.setStatus(DiscordStatus.StandBy);
                }
            } catch (error) {
                luciaApp.error(`Error during Twitch maintenance: ${error}`);
            }
        }, 1000 * 60 * 60 * 3.25); // Maintenance every ~3 hours
    });

    luciaApp.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;
        handleButtonInteraction(interaction);
    });

    luciaApp.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = await interaction.client.commands.get(
            interaction.commandName
        );

        if (!command) {
            console.error(`No command found for ${interaction.commandName}, By: ${interaction.user.globalName} (${interaction.user.username}), At ${luciaApp.getTimestamp()}`);
            return;
        } else {
            console.log(`Executing command: ${interaction.commandName}, By: ${interaction.user.globalName} (${interaction.user.username}), At ${luciaApp.getTimestamp()}`);

            switch (interaction.commandName) {
                case "foodmenu":
                case "drinksmenu":
                    await interaction.deferReply();
                    break;
                case "clearmsg":
                default:
                    await interaction.deferReply({
                        flags: MessageFlags.Ephemeral,
                    });
            }
        }

        try {
            const response = await command.execute(interaction);
            if (response) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply(response);
                } else {
                    await interaction.reply(response);
                }
                console.log(`Command executed successfully`);
            }
        } catch (error) {
            console.error("Error executing command:", error);
            if (interaction.replied || interaction.deferred) {
                interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    });

} else {
    console.error("Failed to start bot");
}
