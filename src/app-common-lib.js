const path = require("node:path");
const { getLucia, luciaError, luciaLog } = require("./app-discord");

const fs = require("node:fs");

async function readTokensFromFile() {
    let tokensData = null;
    try {
        fs.readFile("../json/tokens.json", (error, data) => {
            if (error) {
                luciaLog(error);
                throw luciaError();
            }
            tokensData = JSON.parse(data);
            luciaLog('Read tokens.json successfully!');
        });
        return tokensData;
    } catch (error) {
        luciaLog(error);
        throw luciaError();
    }
}

function writeTokensToFile(tokensData) {
    try {
        fs.writeFile("../json/tokens.json", JSON.stringify(tokensData), (error) => {
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

function readCommands() {
    const commandsPath = "../commands";
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        const lucia = getLucia();
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            lucia.commands.set(command.data.name, command);
            luciaLog(`${command} read!`);
        } else {
            luciaLog(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

module.exports = {
    readTokensFromFile,
    writeTokensToFile,
    readCommands,
}