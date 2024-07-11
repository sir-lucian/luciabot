const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drinksmenu')
        .setDescription('Randomly chooses a drink for refreshing sensation.')
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Specify which kind of drink you want to drink.')
                .setRequired(false)
                .addChoices(
                    { name: 'coffee', value: 'coffee' },
                    { name: 'tea', value: 'tea' },
                    { name: 'juice', value: 'juice' },
                    { name: 'soda', value: 'soda' },
                    { name: 'alcohol', value: 'alcohol' },
                    { name: 'partymode', value: 'partymode' },)),
    async execute(interaction) {
        const category = interaction.options.getString('category') ?? null;
        if (category) {
            fetch("https://api.lucian.solutions/api.drinksmenu.php?args1="+category).then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            });
        } else {
            fetch("https://api.lucian.solutions/api.drinksmenu.php").then((response) => {
                response.text().then((data) => {
                    interaction.reply(data);
                });
            });
        }
    }
}