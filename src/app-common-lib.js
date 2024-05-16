const fs = require("node:fs");
const path = require("node:path");

let tokensData = null;

export async function getTimestamps() {
    const time = new Date();
    return time.toLocaleString();
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
