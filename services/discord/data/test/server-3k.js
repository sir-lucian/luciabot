const { ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
require("dotenv/config");

const WELCOME_MESSAGE = `Test Message`;

function initButton({ id, label, emoji, style }) {
    const button = new ButtonBuilder();
    button.setCustomId(id);
    button.setLabel(label);
    if (emoji) {
        button.setEmoji(emoji);
    }
    button.setStyle(style);
    return button;
}

function initJoinSelector() {
    let buttons = [];

    const button = initButton({
        id: 'join_server_test',
        label: 'Join Server',
        emoji: {
            id: '1052792491088289852',
            name: 'vscode',
            animated: false
        },
        style: ButtonStyle.Secondary,
    });

    buttons.push(button);

    return buttons;
}

module.exports = {
    id: process.env.DC_GUILD_ID_TEST,
    channels: [
        {
            id: 'welcome',
            channel_id: process.env.DC_CHANNEL_TEST,
            message: WELCOME_MESSAGE,
            buttons: initJoinSelector(),
        },
    ],
    alert: undefined,
};