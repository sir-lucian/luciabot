const fs = require("node:fs");
const path = require("node:path");

let isStreaming = false;

let tokensData = null;

export async function getTimestamps() {
    const time = new Date();
    return time.toLocaleString();
}

export async function getStreaming() {
    return isStreaming;
}

export async function setStreaming(bool) {
    isStreaming = bool;
}

export async function readTokensFromFile(lucia) {
    fs.readFile("tokens.json", (error, data) => {
        if (error) {
            console.error(error);
            throw luciaError();
        }
        tokensData = JSON.parse(data);
        console.log("[ReadFile] Read tokens.json successfully!");
    });
}
/* Read Tokens from JSON */
