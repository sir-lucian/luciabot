const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('foodmenu')
        .setDescription('Randomly chooses menu to be cooked or bought.'),
    async execute(interaction) {
        const response = await fetch("https://raw.githubusercontent.com/lucidkarn/luciabot/master/commands/foodmenu.json");
        const foodmenu = await response.json();
        await interaction.reply(foodmenu.foodmenu[Math.floor(Math.random() * foodmenu.foodmenu.length)]);
    }
}