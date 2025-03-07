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
        let fetchUrl = "https://api.lucian.solutions/api.foodmenu.php";
        if (category && halal) {
            fetchUrl += "?args1="+category+"&args2="+halal;
        } else if (category && !halal) {
            fetchUrl += "?args1="+category;
        } else if (!category && halal) {
            fetchUrl += "?args1="+halal;
        }
        try {
            const response = await fetch(fetchUrl);
            const answer = await response.text();
            await interaction.reply(answer);
        } catch (e) {
            console.error(e);
            await interaction.reply({
                content: "Failed to fetch data from API.",
                ephemeral: true,
            });
        }
        
    }
}