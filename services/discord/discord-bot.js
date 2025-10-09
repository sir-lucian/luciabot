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

class discordBot extends Client {
    constructor(token, name, options = {}) {
        if (!token) throw new Error("Discord token is required");
        if (!name) throw new Error("Discord bot name is required");
        if (!options.logChannel) throw new Error("Discord log channel is required");

        super({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                GatewayIntentBits.Guilds,
            ],
        });
        
        this.name = name;
        this.status = "standby";
        this.logChannel = options.logChannel;
        this.token = token;
    }

    initClient() {
        try {
            this.login(this.token);
            return true;
        } catch (error) {
            throw new Error(error);
        }
    }

    initCommands() {
        this.commands = new Collection();
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
    }

    initRoleButtons() {
    }

    log(message) {
        this.channels.cache.get(this.logChannel).send(message);
    }

    setStatus(status = "error") {
        switch (status) {
            case "standby":
                this.user.setPresence({
                    activities: [
                        {
                            name: "น้องมาแอบฟัง",
                            type: ActivityType.Listening,
                        },
                    ],
                    status: "online",
                });
                break;
            case "busy":
                this.user.setPresence({
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
                this.user.setPresence({
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

    announce(channel, message) {
        if (!channel || !message) {
            this.log("Missing parameters for announcing on Discord");
            return;
        } else {
            this.channels.cache.get(channel).send(message);
        }
    }

    error(error = "Unknown error") {
        this.setStatus("error");
        if (typeof error === "object") {
            this.log(`Error: ${JSON.stringify(error)}`);
        } else if (typeof error === "string") {
            this.log(`Error: ${error}`);
        } else {
            this.log("Error: Unknown error type");
        }
    }
}

exports.discordBot = discordBot;
