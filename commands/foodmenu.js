const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('foodmenu')
        .setDescription('Randomly chooses menu to be cooked or bought.'),
    async execute(interaction) {   
        fs.readFile("commands/foodmenu.json", async (error, data) => {
            if (error) {
                console.error(error);
            }
            const response = await JSON.parse(data);
            await interaction.reply(response.foodmenu[Math.floor(Math.random() * response.foodmenu.length)]);
        });
    }
}