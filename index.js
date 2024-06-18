require("dotenv").config();
const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField, } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

/* TWITCH APP TOKENS */
const ttv_app_id = process.env.TWITCH_CLIENT_ID;
const ttv_app_secret = process.env.TWITCH_CLIENT_SECRET;

/* TWITCH USERS */
const ttv_id_lucian = process.env.TTV_STLUCIAN_ID;
const ttv_id_nekosoul = process.env.TTV_NEKOSOUL_ID;

/* DISCORD APP TOKENS */
const dc_app_lucia_token = process.env.DC_APP_TOKEN;
/* const dc_app_lucia_id = process.env.DC_APP_ID; */
const dc_app_lucia_log = process.env.DC_CHANNEL_LUCIALOG;

/* DISCORD STREAM ALERT CHANNELS */
const dc_alert_lucian = process.env.DC_CHANNEL_STLUCIAN;
const dc_alert_nekosoul = process.env.DC_CHANNEL_NEKOSOUL;

/* ALERT MESSAGES */
const msg_lucian = `**Lucian nii-san just went live!**\nLet's go visit the penthouse! <a:LuciaCaughtIn4K:1214998758295601232>\nhttps://twitch.tv/stlucian`;
const msg_nekosoul = `**Soul-chan just went live!**\nLet's go visit the rabbit house! <:nekoso4LoveUSoull:1238163343605366906>\nhttps://twitch.tv/nekoso_ul`;

const lucia = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds
    ],
});

let isStreaming = false;
let tokens = null;
let listeners = null;

let listeners_lucian = [];
let listeners_nekosoul = [];

try {
    fs.readFile("tokens.json", async (error, data) => {
        if (error) {
            throw console.error(error);
        }
        tokens = await JSON.parse(data);
        console.log('Read tokens.json successfully!');
    });
} catch (error) {
    throw console.error('Read Tokens from file failed');
}

function writeTokensToFile(tokensData) {
    try {
        fs.writeFile("tokens.json", JSON.stringify(tokensData), (error) => {
            if (error) {
                luciaLog(error);
                throw luciaError();
            }
            luciaLog('Save tokens.json successfully!');
        });
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }
}

function initCommands() {
    lucia.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

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

    lucia.on(Events.InteractionCreate, async (interaction) => {
        const command = await interaction.client.commands.get(interaction.commandName);
        if (!command) {
            luciaLog('No command matching '+interaction.commandName+' was found.');
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
}

function luciaLog(msg) {
    lucia.channels.cache.get(dc_app_lucia_log).send(msg);
}

async function luciaLogin() {
    await lucia.login(dc_app_lucia_token);
    return 'Lucia is now online on Discord!';
}

async function luciaStart() {
    const msg = await luciaLogin();
    setLuciaPresence('standby');
    console.log(msg);
}

function luciaError() {
    setLuciaPresence();
    luciaLog('Lucia is now confused!');
}

function announceOnDiscord(twitchID = null) {
    switch (twitchID) {
        case getTwitchID('stlucian'):
            lucia.channels.cache.get(dc_alert_lucian).send(msg_lucian);
            break;
        case getTwitchID('nekoso_ul'):
            lucia.channels.cache.get(dc_alert_nekosoul).send(msg_nekosoul);
            break;
        default:
            luciaLog('Twitch user invalid, cannot annouce on Discord');
    }
}

function setLuciaPresence(status = 'error') {
    switch (status) {
        case 'standby':
            lucia.user.setPresence({
                activities: [
                    {
                        name: "น้องมาแอบฟัง",
                        type: ActivityType.Listening,
                    },
                ],
                status: "online",
            });
            break;
        case 'streaming':
            lucia.user.setPresence({
                activities: [
                    {
                        name: "Lucian nii-san's penthouse",
                        type: ActivityType.Streaming,
                        url: `https://twitch.tv/stlucian`,
                    },
                ],
                status: "online",
            });
            break;
        case 'busy':
            lucia.user.setPresence({
                activities: [
                    {
                        name: "with the code!",
                        type: ActivityType.Playing,
                    },
                ],
                status: "dnd",
            });
            break;
        case 'error':
        default:
            lucia.user.setPresence({
                activities: [
                    {
                        name: "Lucia is now confused!",
                        type: ActivityType.Listening,
                    },
                ],
                status: "dnd",
            });
    }
}

function getTwitchID(username) {
    switch (username) {
        case 'stlucian':
            return ttv_id_lucian;
        case 'nekoso_ul':
            return ttv_id_nekosoul;
        default:
            return null;
    }
}

/* Validate Tokens */
async function isTwitchTokenValid(access_token) {
    let headers = new Headers();
    headers.append(`Authorization`, `OAuth ${access_token}`);
    const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
        method: "GET",
        headers: headers,
        redirect: "follow",
    });
    let valid = response.status === 200 ? true : false;
    luciaLog('**[Get]** ValidatedToken');
    luciaLog(valid.toString());
    return valid;
}

/* Initialize Listeners */
async function createListener(access_token) {
    const authProvider = new StaticAuthProvider(ttv_app_id, access_token);
    const apiClient = new ApiClient({ authProvider });
    listeners = new EventSubWsListener({ apiClient });
    listeners.start();

    luciaLog('Lucia is listening!');

    /* STREAM START */
    try {
        listeners_lucian[0] = listeners.onStreamOnline(ttv_id_lucian, () => {
            announceOnDiscord(ttv_id_lucian);
            luciaLog('StLucian started streaming');
            setLuciaPresence('streaming');
            isStreaming = true;
        });
        luciaLog(`**[Created]** StLucian's online listener`);

        listeners_nekosoul[0] = listeners.onStreamOnline(ttv_id_nekosoul, () => {
            announceOnDiscord(ttv_id_nekosoul);
            luciaLog('NeKoSo_UL started streaming');
        });
        luciaLog(`**[Created]** NeKoSo_UL's online listener`);
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }

    /* STREAM STOP */
    try {
        listeners_lucian[1] = listeners.onStreamOffline(ttv_id_lucian, () => {
            luciaLog('StLucian went offline');
            setLuciaPresence('standby');
            isStreaming = false;
        });
        luciaLog(`**[Created]** StLucian's offline listener`);

        listeners_nekosoul[1] = listeners.onStreamOffline(ttv_id_nekosoul, () => {
            announceOnDiscord(dc_alert_nekosoul);
            luciaLog('NeKoSo_UL went offline');
        });
        luciaLog(`**[Created]** NeKoSo_UL's offline listener`);
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }
}

async function refreshToken(tokensData) {
    luciaLog('Renewing Access Token...');
    setLuciaPresence('busy');

    let headers = new Headers();
    headers.append(`Content-Type`, `application/json`);

    let body = {
        client_id: ttv_app_id,
        client_secret: ttv_app_secret,
        grant_type: "refresh_token",
        refresh_token: encodeURIComponent(tokensData.refresh_token),
    };

    const request = new Request("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });
    const response = await fetch(request);
    const response_json = await response.json();
    const newAccessToken = response_json.access_token;
    const newRefreshToken = response_json.refresh_token;

    luciaLog('**[Get]** Access Token');
    luciaLog(`${newAccessToken ? true : false}`);
    luciaLog('**[Get]** Refresh Token');
    luciaLog(`${newRefreshToken ? true : false}`);

    if (!newAccessToken || !newRefreshToken) {
        throw new luciaError();
    } else {
        const tokens = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            last_updated: Date(),
        };

        try {
            writeTokensToFile(tokens);
        } catch (error) {
            luciaLog(error);
            throw luciaError();
        }

        if (isStreaming) {
            setLuciaPresence('streaming');
        } else {
            setLuciaPresence('standby');
        }

        return tokens;
    }
}

/* Auto cycle */
async function performMaintenance() {
    try {
        await listeners_lucian[0].stop();
        luciaLog(`**[Stopped]** StLucian's online listener`);
        await listeners_lucian[1].stop();
        luciaLog(`**[Stopped]** StLucian's offline listener`);
        await listeners_nekosoul[0].stop();
        luciaLog(`**[Stopped]** NeKoSo_UL's online listener`);
        await listeners_nekosoul[1].stop();
        luciaLog(`**[Stopped]** NeKoSo_UL's offline listener`);
        await listeners.stop();
        luciaLog(`**[Stopped]** All listeners`);
        listeners.removeListener();
        luciaLog('Deleted Listeners');
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }
    

    tokens = await refreshToken();
    await createListener(tokens.access_token);
    luciaLog('Resuming Listeners...');
    luciaLog(`**[Maintenance]** Ended`);
}

/* First Time Run */
async function initializeSequence() {
    const response = await refreshToken(tokens);
    if (await isTwitchTokenValid(response.access_token)) {
        createListener(response.access_token);
    } else {
        luciaLog('Initializing Failed');
        throw luciaError();
    }
    return response;
}

/* ---- APP STARTS HERE ---- */

luciaStart();
lucia.on("ready", async () => {
    luciaLog('**Lucia** is being initialized...');
    await initializeSequence();
    initCommands();
    setInterval(() => {
        luciaLog(`**[Maintenance]** Starting...`);
        performMaintenance();
    }, 1000 * 60 * 60 * 3); // Maintenance every 3 hours
});