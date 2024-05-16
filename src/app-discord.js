import { getTimestamps } from "./app-common-lib";

const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField, } = require("discord.js");

export async function luciaOnline(lucia, token) {
    await lucia.login(token);
    await setLuciaPresence(lucia, 'standby');
    console.info(`[${getTimestamps()}] Lucia is now online on Discord!`);
}

export async function luciaError(lucia) {
    await setLuciaPresence(lucia);
    console.error(`[${time}] Lucia is now confused!`);
}

export async function announceOnDiscord(lucia, channel, message, is_lucian) {
    lucia.channels.cache.get(channel).send(message);
    if (is_lucian) { /* If Lucian's channel */
        await setLuciaPresence(lucia, 'streaming');
    }
}

export function setLuciaPresence(lucia, status = 'error') {
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