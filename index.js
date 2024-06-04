const { readTokensFromFile, readCommands } = require("./src/app-common-lib");
const { luciaError, luciaStart, getLucia, luciaLog, initCommands } = require("./src/app-discord");
const { isTwitchTokenValid, refreshToken, performMaintenance } = require("./src/app-twitch");
const { Client } = require("discord.js");

const lucia = getLucia();

let isStreaming = false;
let tokens = readTokensFromFile();
let listeners = null;

function getStreamingStatus() {
    return isStreaming;
}

function setStreamingStatus(bool) {
    isStreaming = bool;
}

module.exports = {
    getStreamingStatus,
    setStreamingStatus,
};

/* First Time Run */
async function initializeSequence() {
    const response = await refreshToken(tokens);
    if (await isTwitchTokenValid(response.access_token)) {
        listeners = await createListener(response.access_token);
    } else {
        luciaLog('Initializing Failed');
        throw luciaError();
    }
    return response;
}

/* ---- APP STARTS HERE ---- */

luciaStart();

lucia.on("ready", async () => {
    luciaLog('Lucia is being initialized...');
    tokens = await initializeSequence();
    readCommands();
    initCommands();
    setInterval(() => {
        [tokens, listeners] = performMaintenance(listeners);
    }, 1000 * 60 * 60 * 3); // Maintenance every 3 hours
});
