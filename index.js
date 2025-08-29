require("dotenv").config();

const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const {
    ActivityType,
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    IntentsBitField,
    MessageFlags,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const buttonWrapper = require("./button-wrapper.js");

/* TWITCH APP TOKENS */
const ttv_app_id = process.env.TWITCH_CLIENT_ID;
const ttv_app_secret = process.env.TWITCH_CLIENT_SECRET;

/* DISCORD APP TOKENS */
const dc_app_lucia_token = process.env.DC_APP_TOKEN;
// const dc_app_lucia_id = process.env.DC_APP_ID;
const dc_app_lucia_log = process.env.DC_APP_LOG;

/* DISCORD CHANNELS */
const dc_data_lucian = {
    id: process.env.DC_GUILD_ID_LUCIAN,
    welcome: {
        channel_id: process.env.DC_CHANNEL_STLUCIAN_WELCOME,
        message: `## Ya~ho☆\nIt's Lucia! Welcome to\n# La résidence de Lucian!\nClick the button below to join!`,
        buttons: [
            new ButtonBuilder()
                .setCustomId("join_server_lucian")
                .setLabel("Join Server")
                .setEmoji("👋")
                .setStyle(ButtonStyle.Success),
            ],
        },
    roles: {
        channel_id: process.env.DC_CHANNEL_STLUCIAN_ROLES,
        message: `# Select your interests\n - Click the button to access the room\n - Click the button again to leave`,
        buttons: [
            new ButtonBuilder()
            .setCustomId("girls_frontline")
            .setLabel("Girls Frontline")
            .setEmoji("🎯")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("blue_archive")
            .setLabel("Blue Archive")
            .setEmoji("📘")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("city_builders")
            .setLabel("City Builders")
            .setEmoji("🏙️")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("minecraft")
            .setLabel("Minecraft")
            .setEmoji("⛏️")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("music_rhythm")
            .setLabel("Music & Rhythm Games")
            .setEmoji("🎵")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("arts_photography")
            .setLabel("Arts & Photography")
            .setEmoji("🎨")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("pokemon")
            .setLabel("Pokémon")
            .setEmoji("🐹")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("wordle")
            .setLabel("Wordle")
            .setEmoji("🧩")
            .setStyle(ButtonStyle.Secondary),
        ],
    },
    alert: undefined
};

const dc_data_momineko = {
    id: process.env.DC_GUILD_ID_MOMINEKO,
    welcome: {
        channel_id: process.env.DC_CHANNEL_MOMINEKO_WELCOME,
        message: `## Ya~ho☆\nIt's Lucia, Momi's new receptionist! Welcome to\n# Momi's Motherbase!\n Click the button to join! :heart:`,
        buttons: [
            new ButtonBuilder()
                .setCustomId("join_server_momineko")
                .setLabel("Join Server")
                .setEmoji("💜")
                .setStyle(ButtonStyle.Secondary),
        ],
    },
    roles: undefined,
    alert: undefined
};

const dc_data_nekosoul = {
    id: process.env.DC_GUILD_ID_NEKOSOUL,
    welcome: undefined,
    roles: undefined,
    alert: {
        twitch_id: process.env.TTV_ID_NEKOSOUL,
        channel: process.env.DC_CHANNEL_NEKOSOUL_ALERT,
        message: `**Soul-chan just went live!**\nLet's go visit the rabbit house! :heart:\nhttps://twitch.tv/nekoso_ul`,
    }
};

const lucia = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds,
    ],
});

let isStreaming = false;
let tokens = {
    access_token: undefined,
    refresh_token: process.env.TWITCH_REFRESH_TOKEN,
};
let listeners = null;
let twitchListenersList = [];

function initCommands() {
    lucia.commands = new Collection();
    const commandsPath = path.join(__dirname, "commands");
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
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
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
    return "Lucia is now online on Discord!";
}

async function luciaStart() {
    const msg = await luciaLogin();
    setLuciaPresence("standby");
    return msg ? true : false;
}

function luciaError(error = "Lucia is now confused!") {
    setLuciaPresence();
    luciaLog(error);
}

function announceOnDiscord(alertChannel = null , message = null) {
    if (!alertChannel || !message) {
        luciaLog("Missing parameters for announcing on Discord");
        return;
    } else {
        lucia.channels.cache.get(alertChannel).send(message);
    }
}

function setLuciaPresence(status = "error") {
    switch (status) {
        case "standby":
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
        case "streaming":
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
        case "busy":
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
        case "error":
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
    luciaLog("**[Get]** ValidatedToken");
    luciaLog(valid.toString());
    return valid;
}

/* Initialize Listeners */
async function createListener(access_token) {
    const authProvider = new StaticAuthProvider(ttv_app_id, access_token);
    const apiClient = new ApiClient({ authProvider });
    listeners = new EventSubWsListener({ apiClient });
    listeners.start();

    luciaLog("Lucia is listening!");

    /* STREAM START */
    try {
        twitchListenersList[0] = listeners.onStreamOnline(
            dc_data_nekosoul.alert.twitch_id,
            () => {
                announceOnDiscord(dc_data_nekosoul.alert.channel, dc_data_nekosoul.alert.message);
                luciaLog("NeKoSo_UL started streaming");
            }
        )
        luciaLog(`**[Created]** Listener: ${twitchListenersList[0].toString()}`);
    } catch (error) {
        throw new luciaError(error.toString());
    }

    /* STREAM STOP */
    try {
        twitchListenersList[1] = listeners.onStreamOffline(
            dc_data_nekosoul.alert.twitch_id,
            () => {
                luciaLog("NeKoSo_UL went offline");
            }
        )
        luciaLog(`**[Created]** Listener: ${twitchListenersList[1].toString()}`);
    } catch (error) {
        throw new luciaError(error.toString());
    }
}

async function refreshToken(tokensData) {
    luciaLog("Renewing Access Token...");
    setLuciaPresence("busy");

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

    luciaLog("**[Get]** Access Token");
    luciaLog(`${newAccessToken ? true : false}`);
    luciaLog("**[Get]** Refresh Token");
    luciaLog(`${newRefreshToken ? true : false}`);

    if (!newAccessToken || !newRefreshToken) {
        throw new luciaError(`**[Error]** No Tokens!`);
    } else {
        const tokens = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        };

        if (isStreaming) {
            setLuciaPresence("streaming");
        } else {
            setLuciaPresence("standby");
        }

        return tokens;
    }
}

/* Auto cycle */
async function performMaintenance() {
    luciaLog(`**[Maintenance]** Starting...`);

    try {
        let tempListener;
        if (twitchListenersList.length > 0) {
            for (tempListener of twitchListenersList) {
                await tempListener.stop();
            }
        }
        await listeners.stop().then(() => {
            luciaLog(`**[Stopped]** All listeners`);
            listeners.removeListener().then(() => {
                luciaLog("Deleted Listeners");
            });
        });
    } catch (error) {
        throw new luciaError(error.toString());
    }

    tokens = await refreshToken(tokens);
    await createListener(tokens.access_token);
    luciaLog("Resuming Listeners...");
    luciaLog(`**[Maintenance]** Ended`);
}

/* First Time Run */
async function initializeSequence() {
    const response = await refreshToken(tokens);
    if (await isTwitchTokenValid(response.access_token)) {
        createListener(response.access_token);
    } else {
        throw new luciaError(`Initializing Failed`);
    }
    return response;
}

/* React Roles */

async function initServerJoin(discordData) {
    if (!discordData.welcome) {
        return;
    }
    const server = await lucia.channels.fetch(discordData.welcome.channel_id);
    if (!server) {
        luciaLog(`Channel not found: ${discordData.welcome.channel_id}`);
        return;
    }

    const messages = await server.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(
        (msg) => msg.author.id === lucia.user.id
    );

    const firstMessage = botMessages.first();
    const buttons = discordData.welcome.buttons;

    const messageObject = {
        content: discordData.welcome.message,
        components: buttonWrapper(buttons),
    };

    if (firstMessage) {
        firstMessage.edit(messageObject);
    } else {
        server.send(messageObject);
    }
}

async function initRoleSelector(discordData) {
    if (!discordData.roles) {
        return;
    }
    const server = await lucia.channels.fetch(discordData.roles.channel_id);
    if (!server) {
        luciaLog(`Channel not found: ${discordData.roles.channel_id}`);
        return;
    }

    const messages = await server.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(
        (msg) => msg.author.id === lucia.user.id
    );

    const firstMessage = botMessages.first();
    const buttons = discordData.roles.buttons;

    const messageObject = {
        content: discordData.roles.message,
        components: buttonWrapper(buttons),
    };

    if (firstMessage) {
        firstMessage.edit(messageObject);
    } else {
        server.send(messageObject);
    }
}

async function getRoles(userId, discordData) {
    const member = await lucia.guilds.cache.get(discordData.id).members.fetch(userId);
    if (!member) return;

    const roles = member.roles.cache.map((role) => role.name);
    return roles;
}

async function doCheckRole(userId, roles, roleName, interaction, discordData) {
    const tempInt = interaction ?? null;
    if (roles && roles.includes(roleName)) {
        await removeRole(userId, roleName, discordData);
        if (tempInt) {
            await tempInt.reply({
                content: `You have been removed from **${roleName}**.`,
                flags: MessageFlags.Ephemeral,
            });
        }
    } else {
        await addRole(userId, roleName, discordData);
        if (tempInt) {
            await tempInt.reply({
                content: `You have been added to the **${roleName}**.`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}

async function addRole(userId, roleName, discordData) {
    const guild = lucia.guilds.cache.get(discordData.id);
    if (!guild) return;

    const member = await guild.members.fetch(userId);
    if (!member) return;

    const role = guild.roles.cache.find((r) => r.name === roleName);
    if (!role) return;

    await member.roles.add(role);
}

async function removeRole(userId, roleName, discordData) {
    const guild = lucia.guilds.cache.get(discordData.id);
    if (!guild) return;

    const member = await guild.members.fetch(userId);
    if (!member) return;

    const role = guild.roles.cache.find((r) => r.name === roleName);
    if (!role) return;

    await member.roles.remove(role);
}

/* ---- APP STARTS HERE ---- */

const startSuccess = luciaStart();
if (startSuccess) {
    lucia.on("ready", async () => {
        luciaLog("**Lucia** is being initialized...");
        tokens = await initializeSequence();
        initCommands();
        await initServerJoin(dc_data_lucian);
        await initServerJoin(dc_data_momineko);
        await initRoleSelector(dc_data_lucian);
        setInterval(performMaintenance, 1000 * 60 * 60 * 3); // Maintenance every 3 hours
    });

    lucia.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (!interaction.isButton()) return;

            const buttonId = interaction.customId ?? null;
            const userId = interaction.user.id;
            let discordData;
            switch (interaction.guildId) {
                case dc_data_lucian.id:
                    discordData = dc_data_lucian;
                    break;
                case dc_data_momineko.id:
                    discordData = dc_data_momineko;
                    break;
                case dc_data_nekosoul.id:
                    discordData = dc_data_nekosoul;
                    break;
                default:
                    discordData = null;
            }
            const roles = await getRoles(userId, discordData);

            switch (buttonId) {
                case "girls_frontline":
                    doCheckRole(userId, roles, "Girls Frontline", interaction, discordData);
                    break;
                case "blue_archive":
                    doCheckRole(userId, roles, "Blue Archive", interaction, discordData);
                    break;
                case "city_builders":
                    doCheckRole(userId, roles, "City Builders", interaction, discordData);
                    break;
                case "minecraft":
                    doCheckRole(userId, roles, "Minecraft", interaction, discordData);
                    break;
                case "music_rhythm":
                    doCheckRole(userId, roles, "Rhythms", interaction, discordData);
                    break;
                case "arts_photography":
                    doCheckRole(userId, roles, "Museum Goers", interaction, discordData);
                    break;
                case "pokemon":
                    doCheckRole(userId, roles, "Pokemon", interaction, discordData);
                    break;
                case "wordle":
                    doCheckRole(userId, roles, "Wordle", interaction, discordData);
                    break;
                case "join_server_lucian":
                    doCheckRole(userId, roles, "Visitor", interaction, discordData);
                    break;
                case "join_server_momineko":
                    doCheckRole(userId, roles, "StarPeople", interaction, discordData);
                    break;
                default:
                    await interaction.reply({
                        content: `You clicked the button with ID: ${interaction.customId}`,
                        flags: MessageFlags.Ephemeral,
                    });
            }
        } catch (error) {
            console.error("Error handling interaction:", error);
            luciaError(error.toString());
            await interaction.reply({
                content: "An error occurred while processing your request.",
                flags: MessageFlags.Ephemeral,
            });
        }
    });
}
