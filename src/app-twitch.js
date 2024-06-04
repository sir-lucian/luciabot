require("dotenv").config();

const { StaticAuthProvider } = require("@twurple/auth");
const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { getStreamingStatus, setStreamingStatus } = require("..");
const { announceOnDiscord, setLuciaPresence, luciaLog } = require("./app-discord");

/* APP TOKENS */
const ttv_app_id = process.env.TWITCH_CLIENT_ID;
const ttv_app_secret = process.env.TWITCH_CLIENT_SECRET;

function getTwitchAppId() {
    return ttv_app_id;
}

function getTwitchAppSecret() {
    return ttv_app_secret;
}

/* TWITCH USERS */
const ttv_id_lucian = process.env.TWITCH_USER_ID;
const ttv_id_nekosoul = process.env.NEKOSOUL_USER_ID;

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
    luciaLog(`ValidatedToken = ${valid}`);
    return valid;
}

/* Initialize Listeners */
async function createListener(access_token) {
    const authProvider = new StaticAuthProvider(ttv_app_id, access_token);
    const apiClient = new ApiClient({ authProvider });
    const stream_listeners = new EventSubWsListener({ apiClient });
    stream_listeners.start();

    logLucia('Lucia is listening!');

    /* STREAM START */
    try {
        stream_listeners.onStreamOnline(ttv_id_lucian, () => {
            announceOnDiscord(ttv_id_lucian);
            logLucia('StLucian started streaming');
            setLuciaPresence('streaming');
            setStreamingStatus(true);
        });

        stream_listeners.onStreamOnline(ttv_id_nekosoul, () => {
            announceOnDiscord(ttv_id_nekosoul);
            logLucia('NeKoSo_UL started streaming');
        });
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }

    /* STREAM STOP */
    try {
        stream_listeners.onStreamOnline(ttv_id_lucian, () => {
            logLucia('StLucian went offline');
            setLuciaPresence('standby');
            setStreamingStatus(false);
        });

        stream_listeners.onStreamOnline(ttv_id_nekosoul, () => {
            announceOnDiscord(dc_alert_nekosoul, stream_alert_nekosoul, false);
            logLucia('NeKoSo_UL went offline');
        });
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }

    return stream_listeners;
}

async function refreshToken(tokensData) {
    luciaLog('Renewing Access Token');
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

    luciaLog(`${newAccessToken ? true : false}`);
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

        if (getStreamingStatus()) {
            setLuciaPresence('streaming');
        } else {
            setLuciaPresence('standby');
        }

        return tokens;
    }
}

/* Auto cycle */
async function performMaintenance(stream_listeners) {
    await stream_listeners.stop();
    stream_listeners.removeListener();
    luciaLog('Stopping Listeners');

    const tokens = await refreshToken();
    const new_listeners = await createListener(tokens.access_token);
    luciaLog('Resuming Listeners');

    return [tokens, new_listeners];
}

module.exports = {
    getTwitchAppId,
    getTwitchAppSecret,
    getTwitchID,
    isTwitchTokenValid,
    createListener,
    refreshToken,
    performMaintenance,
};