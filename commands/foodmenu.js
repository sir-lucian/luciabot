const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('foodmenu')
        .setDescription('Randomly chooses menu to be cooked or bought.')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Specify which type of food you want to eat.')
                .setRequired(false)
                .addChoices(
                    { name: 'rice', value: 'rice' },
                    { name: 'noodles', value: 'noodle' },
                    { name: 'soup', value: 'soup' },
                    { name: 'others', value: 'others' },))
        .addStringOption(option =>
            option
                .setName('halal')
                .setDescription('Filter halal options. (default = no)')
                .setRequired(false)
                .addChoices(
                    { name: 'yes', value: 'yes' },
                    { name: 'no', value: 'no' },)),
    async execute(interaction) {
        const category = interaction.options.getString('category') ?? null;
        const halal = interaction.options.getString('halal') === 'yes' ? 'halal' : null;

        if (category && halal) {
            fetch("https://api.lucian.solutions/api.foodmenu.php?args1="+category+"&args2="+halal).then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            });
        } else if (category && !halal) {
            fetch("https://api.lucian.solutions/api.foodmenu.php?args1="+category).then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            }); 
        } else if (!category && halal) {
            fetch("https://api.lucian.solutions/api.foodmenu.php?args1="+halal).then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            }); 
        } else {
            fetch("https://api.lucian.solutions/api.foodmenu.php").then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            });
        }
    }
}