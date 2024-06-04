const { getTwitchID } = require("./app-twitch");
const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField, } = require("discord.js");

/* APP TOKENS */
const dc_app_lucia_token = process.env.DC_APP_TOKEN;
// const dc_app_lucia_id = process.env.DC_APP_ID;
const dc_app_lucia_log = process.env.DC_CHANNEL_ID_LUCIALOG;

/* DISCORD STREAM ALERT CHANNELS */
const dc_alert_lucian = process.env.DC_CHANNEL_ID_STLUCIAN;
const dc_alert_nekosoul = process.env.DC_CHANNEL_ID_NEKOSOUL;

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
    ]
});

function getLucia() {
    return lucia;
}

function luciaLog(msg) {
    lucia.channels.cache.get(dc_app_lucia_log).send(msg);
}

async function luciaStart() {
    await lucia.login(dc_app_lucia_token);
    setLuciaPresence('standby');
    luciaLog('Lucia is now online on Discord!');
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
            luciaLog('Twitch user invalid');
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

async function initCommands() {
    lucia.commands = new Collection();
    lucia.on(Events.InteractionCreate, async (interaction) => {
        const command = await interaction.client.commands.get(interaction.commandName);
        if (!command) {
            luciaLog(`No command matching ${interaction.commandName} was found.`);
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

module.exports = {
    getLucia,
    luciaStart,
    luciaLog,
    luciaError,
    announceOnDiscord,
    setLuciaPresence,
    initCommands
};