require("dotenv").config();
const path = require("node:path");
const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField, } = require("discord.js");
const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { announceOnDiscord, luciaOnline, luciaError } = require("./src/app-discord");
const { getTimestamps } = require("./src/app-common-lib");

let tokens_json = null;
let stream_listeners = null;

const lucialatte_app = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds,
    ],
});

/* First Time Run */
async function initializeSequence(lucia, token) {
    token = await refreshToken(lucia);
    if (await isTwitchTokenValid(tokens_json.access_token)) {
        await createListener(tokens_json.access_token);
    } else {
        console.log(`Initializing Failed`);
        throw luciaError();
    }
}

/* Renew Tokens */
async function refreshToken(lucia) {
    console.log(`Renewing Access Token`);
    lucia.user.setPresence({
        activities: [
            {
                name: "with Twitch API",
                type: ActivityType.Playing,
            },
        ],
        status: "dnd",
    });
    let headers = new Headers();
    headers.append(`Content-Type`, `application/json`);
    let body = {
        client_id: ttv_app_lucia_id,
        client_secret: ttv_app_lucia_secret,
        grant_type: "refresh_token",
        refresh_token: encodeURIComponent(tokens_json.refresh_token),
    };

    const request = new Request("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });
    const response = await fetch(request);

    const responde_json = await response.json();

    let newAccessToken = responde_json.access_token;
    let newRefreshToken = responde_json.refresh_token;
    console.log(`[NewAccessToken] ${newAccessToken ? true : false}`);
    console.log(`[NewRefreshToken] ${newRefreshToken ? true : false}`);
    if (!newAccessToken || !newRefreshToken) {
        throw new luciaError(lucia);
    } else {
        const data = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            last_updated: Date(),
        };

        saveTokensToFile(data);

        if (isStreaming) {
            lucialatte_app.user.setPresence({
                activities: [
                    {
                        name: "Lucian nii-san's penthouse",
                        type: ActivityType.Streaming,
                        url: `https://twitch.tv/stlucian`,
                    },
                ],
                status: "online",
            });
        } else {
            lucialatte_app.user.setPresence({
                activities: [
                    {
                        name: "น้องมาแอบฟัง",
                        type: ActivityType.Listening,
                    },
                ],
                status: "online",
            });
        }

        return data;
    }
}

/* Auto cycle */
async function performMaintenance() {
    await stream_listeners.stop();
    stream_listeners.removeListener();
    console.log(`[STOP] Stopping Listeners`);

    tokens_json = await refreshToken();
    await createListener(tokens_json.access_token);

    console.log(`[RESUME] Resuming Listeners`);
}

/* ---- APP STARTS HERE ---- */

luciaOnline(lucialatte_app, dc_app_lucia_token);

lucialatte_app.on("ready", async (lucia) => {
    console.log(`[${getTimestamps()}] ${lucia.user.username} is being initialized...`);
    await initializeSequence();

    lucia.commands = new Collection();

    const commandsPath = path.join("./commands");
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            lucia.commands.set(command.data.name, command);
        } else {
            console.warn(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }

    lucia.on(Events.InteractionCreate, async (interaction) => {
        const command = await interaction.client.commands.get(
            interaction.commandName
        );

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
    });

    setInterval(performMaintenance, 1000 * 60 * 60 * 3); // Maintenance every 3 hours
});
