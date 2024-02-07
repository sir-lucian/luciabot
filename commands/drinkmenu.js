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
                    { name: 'coffee', value: '0' },
                    { name: 'tea', value: '1' },
                    { name: 'juice', value: '2' },
                    { name: 'soda', value: '3' },
                    { name: 'alcohol', value: '4' },))
        .addStringOption(option =>
            option
                .setName('partymode')
                .setDescription('This mode will include alcohol and energy drinks in randomizer.')
                .setRequired(false)
                .addChoices(
                    { name: 'yes', value: 'yes' },
                    { name: 'no', value: 'no' },)),
    async execute(interaction) {
        const response = await fetch("https://lucian.solutions/files/drinksmenu.json");
        const drinksmenu = await response.json();
        const partymode = interaction.options.getString('partymode') ?? 'no';
        let category = "";
        if (partymode === 'yes') {
            category = interaction.options.getString('category') ?? Math.floor(Math.random() * 5).toString();
        } else {
            category = interaction.options.getString('category') ?? Math.floor(Math.random() * 4).toString();
        }

        async function randomDrink(options) {
            let reply = "";
            switch (options) {
                case '0': // Coffee
                    reply = drinksmenu.coffee[Math.floor(Math.random() * drinksmenu.coffee.length)];
                    break;
                case '1': // Tea
                    reply = drinksmenu.tea[Math.floor(Math.random() * drinksmenu.tea.length)];
                    break;
                case '2': // Juice
                    reply = drinksmenu.juice[Math.floor(Math.random() * drinksmenu.juice.length)];
                    break;
                case '3': // Soda
                    reply = drinksmenu.soda[Math.floor(Math.random() * drinksmenu.soda.length)];
                    break;
                case '4': // Alcohol
                default:
                    reply = drinksmenu.alcohol[Math.floor(Math.random() * drinksmenu.alcohol.length)];
                    break;
            }
            return reply;
        }

        const answer = await randomDrink(category);
        interaction.reply(answer);
    }
}