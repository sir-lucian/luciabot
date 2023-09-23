const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

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
            fs.readFile("commands/heroter.json", async (error, data) => {
                if (error) {
                    console.error(error);
                }

                const response = await JSON.parse(data);
                await interaction.reply(response.quotes[Math.floor(Math.random() * response.quotes.length)]);
            });
            
        }
    }
}