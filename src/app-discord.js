import { getTimestamps } from "./app-common-lib";

const { ActivityType, Client, Collection, Events, GatewayIntentBits, IntentsBitField, } = require("discord.js");

const dc_channel_lucialog = process.env.DC_CHANNEL_ID_LUCIALOG;
const dc_app_lucia_token = process.env.DC_APP_LUCIALATTE_TOKEN;
const dc_alert_lucian = process.env.DC_CHANNEL_ID_STLUCIAN;
const dc_alert_nekosoul = process.env.DC_CHANNEL_ID_NEKOSOUL;

const stream_alert_lucian = `**Lucian nii-san just went live!**\nLet's go visit the penthouse! <a:LuciaCaughtIn4K:1214998758295601232>\nhttps://twitch.tv/stlucian`;
const stream_alert_nekosoul = `**Soul-chan just went live!**\nLet's go visit the rabbit house! <:nekoso4LoveUSoull:1238163343605366906>\nhttps://twitch.tv/nekoso_ul`;

const lucia = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds,
    ],
});

export function logLucia(msg) {
    lucia.channels.cache.get(dc_channel_lucialog).send(msg);
}

export async function luciaOnline(token) {
    await lucia.login(token);
    await setLuciaPresence(lucia, 'standby');
    console.info(`[${getTimestamps()}] Lucia is now online on Discord!`);
}

export async function luciaError() {
    await setLuciaPresence(lucia);
    console.error(`[${time}] Lucia is now confused!`);
}

export async function announceOnDiscord(channel, message) {
    lucia.channels.cache.get(channel).send(message);
}

export async function setLuciaPresence(status = 'error') {
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

export async function refreshToken() {
    console.log(`Renewing Access Token`);
    await lucia.setLuciaPresence(lucia, 'busy');
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