const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('heroter')
        .setDescription('Randomly says things that Heroter said or did.'),
    async execute(interaction) {   
        if (await interaction.user.id === `167376301148209152`) {
            const response = [
                "มีอะไรคะพี่ Heeroter <:LuciaLetMeIn:1110190132813905940> ",
                "พี่อะหยุดดิ๊ <:LuciaSplash:1114455882357542964>"
            ]
            await interaction.reply(response[Math.floor(Math.random() * response.length)]);
        }
        else {
            const response = await fetch("https://raw.githubusercontent.com/lucidkarn/luciabot/master/commands/heroter.json");
            const heroter = await response.json();
            await interaction.reply(heroter.quotes[Math.floor(Math.random() * heroter.quotes.length)]);
        }
    }
}