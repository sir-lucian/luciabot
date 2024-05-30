require("dotenv").config();

const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { getTimestamps, setStreaming } = require("./app-common-lib");
const { announceOnDiscord, logLucia, setLuciaPresence } = require("./app-discord");

const ttv_id_lucian = process.env.TWITCH_USER_ID;
const ttv_id_nekosoul = process.env.NEKOSOUL_USER_ID;

const ttv_app_lucia_id = process.env.TWITCH_CLIENT_ID;
const ttv_app_lucia_secret = process.env.TWITCH_CLIENT_SECRET;

const dc_app_lucia_token = process.env.DC_APP_LUCIALATTE_TOKEN;
const dc_alert_lucian = process.env.DC_CHANNEL_ID_STLUCIAN;
const dc_alert_nekosoul = process.env.DC_CHANNEL_ID_NEKOSOUL;

const stream_alert_lucian = `**Lucian nii-san just went live!**\nLet's go visit the penthouse! <a:LuciaCaughtIn4K:1214998758295601232>\nhttps://twitch.tv/stlucian`;
const stream_alert_nekosoul = `**Soul-chan just went live!**\nLet's go visit the rabbit house! <:nekoso4LoveUSoull:1238163343605366906>\nhttps://twitch.tv/nekoso_ul`;

/* Validate Tokens */
export async function isTwitchTokenValid(token) {
    let headers = new Headers();
    headers.append(`Authorization`, `OAuth ${token}`);
    const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
        method: "GET",
        headers: headers,
        redirect: "follow",
    });
    let valid = response.status === 200 ? true : false;
    console.log(`[${getTimestamps()}] ValidatedToken = ${valid}`);
    return valid;
}

/* Initialize Listeners */
export async function createListener(token) {
    let authProvider = new StaticAuthProvider(ttv_app_lucia_id, token);
    let apiClient = new ApiClient({ authProvider });
    stream_listeners = new EventSubWsListener({ apiClient });
    stream_listeners.start();

    logLucia('Lucia is listening!');

    try {
        stream_listeners.onStreamOnline(ttv_id_lucian, () => {
            announceOnDiscord(dc_alert_lucian, stream_alert_lucian, true);
            logLucia(stream_alert_lucian);
            setLuciaPresence('streaming');
            setStreaming(true);
        });

        stream_listeners.onStreamOnline(ttv_id_nekosoul, () => {
            announceOnDiscord(dc_alert_nekosoul, stream_alert_nekosoul, false);
            logLucia(stream_alert_nekosoul);
        });
    } catch (error) {
        throw luciaError(lucia);
    }

    try {

        stream_listeners.onStreamOnline(ttv_id_lucian, () => {
            announceOnDiscord(dc_alert_lucian, 'Lucian nii-san just went offline.', true);
            logLucia(stream_alert_lucian);
            setLuciaPresence('streaming');
            setStreaming(true);
        });

        stream_listeners.onStreamOnline(ttv_id_nekosoul, () => {
            announceOnDiscord(dc_alert_nekosoul, stream_alert_nekosoul, false);
            logLucia(stream_alert_nekosoul);
        });

        stream_listeners.onStreamOffline(ttv_id_lucian, () => {
            console.log("[" + Date() + "] Lucian nii-san just went offline.");
            lucialatte_app.user.setPresence({
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
        stream_listeners.onStreamOffline(ttv_id_nekosoul, () => {
            console.log("[" + Date() + "] Soul-chan just went offline.");
        });
    } catch {
        throw luciaError();
    }
}