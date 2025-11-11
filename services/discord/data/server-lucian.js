const { ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
require("dotenv/config");

const WELCOME_MESSAGE = `## Ya~ho☆\nIt's Lucia! Welcome to\n# La résidence de Lucian!\nClick the button below to join!`;
const ROLES_MESSAGE = `# Select your interests\n - Click the button to access the room\n - Click the button again to leave`;

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
        id: "join_server_lucian",
        label: "Join Server",
        emoji: {
            id: "1213050602125525063",
            name: "LucianHey",
            animated: false,
        },
        style: ButtonStyle.Secondary,
    });

    buttons.push(button);

    return buttons;
}

function initRoleSelector() {
    let buttons = [];

    buttons.push(
        initButton({
            id: "girls_frontline",
            label: "Girls Frontline",
            emoji: { name: "🎯" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "blue_archive",
            label: "Blue Archive",
            emoji: { name: "📘" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "city_builders",
            label: "City Builders",
            emoji: { name: "🏙️" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "minecraft",
            label: "Minecraft",
            emoji: { name: "⛏️" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "music_rhythm",
            label: "Music & Rhythm Games",
            emoji: { name: "🎵" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "arts_photography",
            label: "Arts & Photography",
            emoji: { name: "🎨" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "pokemon",
            label: "Pokémon",
            emoji: { name: "🐹" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "umamusume",
            label: "Uma Musume",
            emoji: { name: "🐴" },
            style: ButtonStyle.Secondary,
        })
    );

    buttons.push(
        initButton({
            id: "wordle",
            label: "Wordle",
            emoji: { name: "🧩" },
            style: ButtonStyle.Secondary,
        })
    );

    return buttons;
}

const embed = [{
    image: {
        url: 'https://lucian.solutions/images/22.jpg',
    }
}];

module.exports = {
    id: process.env.DC_GUILD_ID_LUCIAN,
    channels: [
        {
            id: "welcome",
            channel_id: process.env.DC_CHANNEL_STLUCIAN_WELCOME,
            message: WELCOME_MESSAGE,
            embeds: embed,
            buttons: initJoinSelector(),
        },
        {
            id: "roles",
            channel_id: process.env.DC_CHANNEL_STLUCIAN_ROLES,
            message: ROLES_MESSAGE,
            buttons: initRoleSelector(),
        },
    ],
    alert: undefined,
};
