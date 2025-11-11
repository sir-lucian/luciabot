const { ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
require("dotenv/config");


const WELCOME_MESSAGE = `## Ya~ho☆\nIt's Lucia, Momi's new receptionist! Welcome to\n# Momi's Motherbase!\n Click the button to join! :heart:`;

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
        id: 'join_server_momineko',
        label: 'Join Server',
        emoji: { name: '💜' },
        style: ButtonStyle.Secondary,
    });

    buttons.push(button);

    return buttons;
}

module.exports = {
    id: process.env.DC_GUILD_ID_MOMINEKO,
    channels: [
        {
            id: 'welcome',
            channel_id: process.env.DC_CHANNEL_MOMINEKO_WELCOME,
            message: WELCOME_MESSAGE,
            buttons: initJoinSelector(),
        },
    ],
    alert: undefined,
};