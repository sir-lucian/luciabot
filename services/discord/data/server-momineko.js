const { ButtonBuilder, EmbedBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
const { Embeds } = require("../data/embeds/index.js");
require("dotenv/config");

const WELCOME_MESSAGE = `## Ya~ho☆\nIt's Lucia, Momi's new receptionist! Welcome to\n# Momi's Motherbase!\nClick the button to join! :heart:`;

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
        emoji: {
            id: "980341340669890571",
            name: "momiluv2",
            animated: false,
        },
        style: ButtonStyle.Secondary,
    });

    buttons.push(button);

    return buttons;
}

const embeds = new Embeds();

const embedsWelcome = [
    new EmbedBuilder()
        .setTitle("Ya~ho☆")
        .setDescription("It's Lucia! This is Momi's Motherbase!")
        .setImage(
            "https://pbs.twimg.com/media/F_qPYXuacAAXjT3?format=jpg&name=large"
        )
        .setAuthor({
            name: embeds.getEmbedsAuthor().name,
            iconURL: embeds.getEmbedsAuthor().iconURL,
        })
        .setFooter({ text: embeds.getEmbedsFooter().text, iconURL: embeds.getEmbedsFooter().iconURL })
        .setColor(0x7f00ff),
];

module.exports = {
    id: process.env.DC_GUILD_ID_MOMINEKO,
    channels: [
        {
            id: 'welcome',
            channel_id: process.env.DC_CHANNEL_MOMINEKO_WELCOME,
            message: WELCOME_MESSAGE,
            embeds: embedsWelcome,
            buttons: initJoinSelector(),
        },
    ],
    alert: undefined,
};