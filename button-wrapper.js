const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (buttons) => {
    const components = [];
    let row = new ActionRowBuilder(); 

    for (let i = 0; i < buttons.length && i < 20; i++) {
        if (i % 4 === 0 && i > 0) {
            components.push(row);
            row = new ActionRowBuilder();
        }

        row.addComponents(buttons[i]);

        // TODO: Add a check for button type
    }

    if (row.components.length > 0) {
        components.push(row);
    }

    return components;
}