require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField } = require("discord.js");
const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");

const discordToken = process.env.DISCORD_TOKEN;
const discordChannel = process.env.DISCORD_CHANNEL_ID;

const twitchUserID = process.env.TWITCH_USER_ID;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

var tokensData = null;
var streamListener = null;

let isStreaming = false;

/* Read Tokens from JSON */
fs.readFile("tokens.json", (error, data) => {
    if (error) {
        console.error(error);
        throw luciaError();
    }
    tokensData = JSON.parse(data);
    console.log("[ReadFile] Read tokens.json successfully!");
});

/* Initialize Lucia Discord App */
const luciaClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds
    ],
});

/* Get Lucia online status */
async function luciaOnline() {
    await luciaClient.login(discordToken);
    luciaClient.user.setPresence({
        activities: [
            {
                name: "น้องมาแอบฟัง",
                type: ActivityType.Listening,
            },
        ],
        status: "online",
    });
    console.log("Lucia is now online on Discord!");
}

async function luciaError() {
    luciaClient.user.setPresence({
        activities: [
            {
                name: "Something went wrong",
                type: ActivityType.Listening,
            },
        ],
        status: "dnd",
    });
    console.error("[ERROR] Lucia is now confused!");
}

/* Validate Tokens */
async function isTwitchTokenValid(token) {
    let headers = new Headers();
    headers.append(`Authorization`, `OAuth ${token}`);
    const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
        method: "GET",
        headers: headers,
        redirect: "follow",
    });
    let valid = response.status === 200 ? true : false;
    console.log(`[ValidatedToken] ${valid}`);
    return valid;
}

/* Initialize Listeners */
async function createListener(token) {
    let authProvider = new StaticAuthProvider(twitchClientId, token);
    let apiClient = new ApiClient({ authProvider });
    streamListener = new EventSubWsListener({ apiClient });
    streamListener.start();

    console.log(`${luciaClient.user.username} is listening!`);

    try {
        streamListener.onStreamOnline(twitchUserID, () => {
            console.log(
                `[${Date()}] Lucian nii-san just went live!: https://twitch.tv/stlucian`
            );

            /* Announce on Discord */
            luciaClient.channels.cache
                .get(discordChannel)
                .send(
                    `**Lucian nii-san just went live!**\nLet's go visit the penthouse! <a:LuciaCaughtIn4K:1214998758295601232>\nhttps://twitch.tv/stlucian`
                );

            luciaClient.user.setPresence({
                activities: [
                    {
                        name: "Lucian nii-san's penthouse",
                        type: ActivityType.Streaming,
                        url: `https://twitch.tv/stlucian`,
                    },
                ],
                status: "online",
            });

            isStreaming = true;
        });
    } catch (error) {
        throw luciaError();
    }

    try {
        streamListener.onStreamOffline(twitchUserID, () => {
            console.log("[" + Date() + "] Lucian nii-san just went offline.");
            luciaClient.user.setPresence({
                activities: [
                    {
                        name: "น้องมาแอบฟัง",
                        type: ActivityType.Listening,
                    },
                ],
                status: "online",
            });

            isStreaming = false;
        });
    } catch {
        throw luciaError();
    }
}

/* First Time Run */
async function initializeSequence() {
    tokensData = await refreshToken();
    if (await isTwitchTokenValid(tokensData.access_token)) {
        await createListener(tokensData.access_token);
    } else {
        console.log(`Initializing Failed`);
        throw luciaError();
    }
}

/* Renew Tokens */
async function refreshToken() {
    console.log(`Renewing Access Token`);
    luciaClient.user.setPresence({
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
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
        grant_type: "refresh_token",
        refresh_token: encodeURIComponent(tokensData.refresh_token),
    };

    const request = new Request("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });
    const response = await fetch(request);

    const responseData = await response.json();

    let newAccessToken = responseData.access_token;
    let newRefreshToken = responseData.refresh_token;
    console.log(`[NewAccessToken] ${newAccessToken ? true : false}`);
    console.log(`[NewRefreshToken] ${newRefreshToken ? true : false}`);
    if (!newAccessToken || !newRefreshToken) {
        throw new luciaError();
    } else {
        const data = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            last_updated: Date(),
        };

        fs.writeFile("tokens.json", JSON.stringify(data), (error) => {
            if (error) {
                console.error(error);
                throw luciaError();
            }
            console.log("[SaveFile] Save tokens.json successfully!");
        });

        if (isStreaming) {
            luciaClient.user.setPresence({
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
            luciaClient.user.setPresence({
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
    await streamListener.stop();
    streamListener.removeListener();
    console.log(`[STOP] Stopping Listeners`);

    tokensData = await refreshToken();
    await createListener(tokensData.access_token);

    console.log(`[RESUME] Resuming Listeners`);
}

/* ---- APP STARTS HERE ---- */

luciaOnline();

luciaClient.on("ready", async (lucia) => {
    console.log(`${lucia.user.username} is being initialized...`);
    await initializeSequence();

    lucia.commands = new Collection();

    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
	    const filePath = path.join(commandsPath, file);
	    const command = require(filePath);
	    // Set a new item in the Collection with the key as the command name and the value as the exported module
	    if ('data' in command && 'execute' in command) {
		    lucia.commands.set(command.data.name, command);
	    } else {
		    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	    }
    }

    lucia.on(Events.InteractionCreate, async interaction => {
        const command = await interaction.client.commands.get(interaction.commandName);
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });

    setInterval(performMaintenance, 1000 * 60 * 60 * 3); // Maintenance every 3 hours
});
