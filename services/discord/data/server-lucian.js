const { ButtonBuilder, EmbedBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");
const { Embeds } = require("../data/embeds/index.js");
require("dotenv/config");

const WELCOME_MESSAGE = `## Ya~ho☆\nIt's Lucia! Welcome to\n# La résidence de Lucian!\nClick the button below to join!`;
const ROLES_MESSAGE = `# Select your interests\n - Click the button to access the room\n - Click the button again to leave`;

const ROLES_LIST = [
    { id: 'girls_frontline', name: 'Girls Frontline', description: 'Rooms: Girls Frontline', emoji: '🎯' },
    { id: 'blue_archive', name: 'Blue Archive', description: 'Rooms: Blue Archive', emoji: '📘' },
    { id: 'city_builders', name: 'City Builders', description: 'Rooms: City Builders', emoji: '🏙️' },
    { id: 'minecraft', name: 'Minecraft', description: 'Rooms: Minecraft, Minecraft Server Log', emoji: '⛏️' },
    { id: 'music_rhythm', name: 'Music & Rhythm Games', role: 'Rhythms', description: 'Rooms: Musique et Otoge', emoji: '🎵' },
    { id: 'arts_photography', name: 'Arts & Photography', role: 'Museum Goers', description: 'Rooms: La Galerie D\'Art', emoji: '🎨' },
    { id: 'pokemon', name: 'Pokémon', description: 'Rooms: Pokémon', emoji: '🐹' },
    { id: 'uma_musume', name: 'Uma Musume', description: 'Rooms: Uma Musume Pretty Derby', emoji: '🐴' },
    { id: 'wordle', name: 'Wordle', description: 'Rooms: Wordle', emoji: '🧩' },
]

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

    ROLES_LIST.forEach(role => {
        buttons.push(
            initButton({
                id: role.id,
                label: role.name,
                emoji: { name: role.emoji },
                style: ButtonStyle.Secondary,
            })
        );
    });

    return buttons;
}

function transformRolesToFields() {
    let fields = [];

    ROLES_LIST.forEach(role => {
        fields.push({
            name: `${role.emoji}  ${role.name}`,
            value: role.description,
            inline: false,
        });
    });

    return fields;
}

const embeds = new Embeds();

const embedsWelcome = [
    new EmbedBuilder()
        .setTitle("Ya~ho☆")
        .setDescription("It's Lucia! This is La résidence de Lucian!")
        .setImage("https://lucian.solutions/images/22.jpg")
        .setAuthor({
            name: embeds.getEmbedsAuthor().name,
            iconURL: embeds.getEmbedsAuthor().iconURL,
        })
        .setFooter({ text: embeds.getEmbedsFooter().text, iconURL: embeds.getEmbedsFooter().iconURL })
        .setColor(0xd4af37),
];

const embedsRoles = [
    new EmbedBuilder()
        .setTitle("Ya~ho☆")
        .setDescription("Please Select Your Interests")
        .setFields(transformRolesToFields())
        .setImage("https://lucian.solutions/images/239t.png")
        .setAuthor({
            name: embeds.getEmbedsAuthor().name,
            iconURL: embeds.getEmbedsAuthor().iconURL,
        })
        .setFooter({ text: embeds.getEmbedsFooter().text, iconURL: embeds.getEmbedsFooter().iconURL })
        .setColor(0xd4af37),
]

module.exports = {
    id: process.env.DC_GUILD_ID_LUCIAN,
    channels: [
        {
            id: "welcome",
            channel_id: process.env.DC_CHANNEL_STLUCIAN_WELCOME,
            message: WELCOME_MESSAGE,
            embeds: embedsWelcome,
            buttons: initJoinSelector(),
        },
        {
            id: "roles",
            channel_id: process.env.DC_CHANNEL_STLUCIAN_ROLES,
            message: ROLES_MESSAGE,
            embeds: embedsRoles,
            buttons: initRoleSelector(),
        },
    ],
    alert: undefined,
    roles: ROLES_LIST,
    actions: [
        { id: 'join_server_lucian', role: 'Visitor' }
    ]
};
