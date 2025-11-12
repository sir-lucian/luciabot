const { SlashCommandBuilder, MessageFlags } = require("discord.js");

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
        let fetchUrl = "https://api.lucian.solutions/api.drinksmenu.php";
        if (category) {
            fetchUrl += "?args1="+category;
        }
        try {
            const response = await fetch(fetchUrl);
            const answer = await response.text();
            return answer;
        } catch (e) {
            console.error("Command drinksmenu error:", e);
            await interaction.followUp({
                content: "Failed to fetch data from API.",
                flags: MessageFlags.Ephemeral,
            });
            return null;
        }
    }
}