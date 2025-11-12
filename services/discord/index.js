const {
    ActionRowBuilder,
    ActivityType,
    Client,
    GatewayIntentBits,
    IntentsBitField,
    MessageFlags,
    PresenceUpdateStatus
} = require("discord.js");

function buttonWrapper(buttons) {
    const components = [];
    let row = new ActionRowBuilder();

    for (let i = 0; i < buttons.length && i < 20; i++) {
        if (i % 4 === 0 && i > 0) {
            components.push(row);
            row = new ActionRowBuilder();
        }
        row.addComponents(buttons[i]);
    }

    if (row.components.length > 0) {
        components.push(row);
    }

    return components;
}

class DiscordBot extends Client {
    constructor(token, name, options = {}) {
        console.log("Starting Discord Bot...", name);
        if (!token) throw new Error("Discord token is required");
        if (!name) throw new Error("Discord bot name is required");
        if (!options.log_channel)
            throw new Error("Discord log channel is required");

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
        this.log_channel = options.log_channel;
        this.servers = options.servers ?? [];
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

    initRoleButtons() {
        this.servers.forEach((server_data) => {
            server_data.channels.forEach(async (channel) => {
                if (channel.channel_id && channel.buttons) {
                    const channelData = await this.channels.fetch(
                        channel.channel_id
                    );
                    if (channelData) {
                        const messages = await channelData.messages.fetch({
                            limit: 15,
                        });
                        const botMessage = messages.filter(
                            (msg) => msg.author.id === this.user.id
                        );
                        const firstMessage = botMessage.first();
                        const buttons = channel.buttons;
                        const embeds = channel.embeds ?? [];

                        const msgObject = {
                            content: channel.message,
                            embeds: embeds,
                            components: buttonWrapper(buttons),
                        };

                        if (firstMessage) {
                            firstMessage.edit(msgObject);
                        } else {
                            channelData.send(msgObject);
                        }
                    }
                }
            });
        });
    }

    log(message) {
        this.channels.cache.get(this.log_channel).send(message);
        console.log(`[${this.name} LOG]: ${message}`);
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
                    status: PresenceUpdateStatus.Online,
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
                    status: PresenceUpdateStatus.DoNotDisturb,
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
                    status: PresenceUpdateStatus.DoNotDisturb,
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

    async doToggleRole(role_name, interaction) {
        const tempInteraction = interaction ?? null;
        const activeServerId =
            this.servers.find((server) => server.id === interaction.guildId)
                .id ?? null;
        if (!activeServerId) return;
        const roles = await this.#getRoles(interaction.user.id, activeServerId);
        if (roles && roles.includes(role_name)) {
            this.#removeRole(interaction.user.id, role_name, activeServerId);
            if (tempInteraction) {
                tempInteraction.reply({
                    content: `You've been removed from **${role_name}**`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        } else if (roles && !roles.includes(role_name)) {
            this.#addRole(interaction.user.id, role_name, activeServerId);
            if (tempInteraction) {
                tempInteraction.reply({
                    content: `You've been added to **${role_name}**`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    }

    async #getRoles(user_id, server_id) {
        const member = await this.guilds.cache
            .get(server_id)
            .members.fetch(user_id);
        if (!member) return;

        const roles = member.roles.cache.map((role) => role.name);
        return roles;
    }

    async #addRole(user_id, role_name, server_id) {
        const guild = this.guilds.cache.get(server_id);
        if (!guild) {
            console.log("Guild not found");
            return;
        }
        const member = await guild.members.fetch(user_id);
        if (!member) {
            console.log("Member not found");
            return;
        };
        const role = guild.roles.cache.find((r) => r.name === role_name);
        if (!role) {
            console.log("Role not found");
            return;
        };
        await member.roles.add(role);
    }

    async #removeRole(user_id, role_name, server_id) {
        const guild = this.guilds.cache.get(server_id);
        if (!guild) return;
        const member = await guild.members.fetch(user_id);
        if (!member) return;
        const role = guild.roles.cache.find((r) => r.name === role_name);
        if (!role) return;
        await member.roles.remove(role);
    }
}

module.exports = {
    DiscordBot,
};