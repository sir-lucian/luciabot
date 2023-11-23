const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('foodmenu')
        .setDescription('Randomly chooses menu to be cooked or bought.')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Specify which type of food you want to eat.')
                .setRequired(false)
                .addChoices(
                    { name: 'rice', value: 0 },
                    { name: 'noodles', value: 1 },
                    { name: 'soup', value: 2 },
                    { name: 'others', value: 3 },
                ))
        .setAutocomplete(true),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused(true);
        let choices;
        if (focusedOption.name === 'category') {
            choices = ['rice', 'noodles', 'soup', 'others'];
        }
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choices.indexOf(choice) })),
        );
    },
    async execute(interaction) {
        const response = await fetch("https://raw.githubusercontent.com/lucidkarn/luciabot/master/commands/foodmenu.json");
        const foodmenu = await response.json();
        const options = interaction.options.getString('category') ?? Math.floor(Math.random() * 4);
        let reply = "";
        switch (options) {
            case 0: // Rice
                reply += "ข้าว";
                switch (Math.floor(Math.random() * 3)) {
                    case 0: // Wok Station
                        switch (Math.floor(Math.random() * 2)) { // Prefix or Suffix
                            case 0: // With Prefix
                                reply += foodmenu.rice.wokstation.prefix[Math.floor(Math.random() * foodmenu.rice.wokstation.prefix.length)];
                                reply += foodmenu.rice.wokstation.meat[Math.floor(Math.random() * foodmenu.rice.wokstation.meat.length)];
                                reply += foodmenu.rice.wokstation.toppings[Math.floor(Math.random() * foodmenu.rice.wokstation.toppings.length)];
                                break;
                            case 1: // With Suffix
                            default:
                                reply += foodmenu.rice.wokstation.meat[Math.floor(Math.random() * foodmenu.rice.wokstation.meat.length)];
                                reply += foodmenu.rice.wokstation.suffix[Math.floor(Math.random() * foodmenu.rice.wokstation.suffix.length)];
                                reply += foodmenu.rice.wokstation.toppings[Math.floor(Math.random() * foodmenu.rice.wokstation.toppings.length)];
                        }
                        break;
                    case 1: // Eggs
                        reply += foodmenu.rice.eggs.method[Math.floor(Math.random() * foodmenu.rice.eggs.method.length)];
                        reply += foodmenu.rice.eggs.meat[Math.floor(Math.random() * foodmenu.rice.eggs.meat.length)];
                        break;
                    case 2: // Others
                    default:
                        reply += foodmenu.rice.others[Math.floor(Math.random() * foodmenu.rice.others.length)];
                }
                break;
            case 1: // Noodles
                reply += "ก๋วยเตี๋ยว";
                switch (Math.floor(Math.random() * 2)) {
                    case 0: // Type
                        reply += foodmenu.noodles.type[Math.floor(Math.random() * foodmenu.noodles.type.length)];
                        break;
                    case 1: // Others
                    default:
                        reply = foodmenu.noodles.others[Math.floor(Math.random() * foodmenu.noodles.others.length)];
                }
                break;
            case 2: // Soup
                reply += foodmenu.soup[Math.floor(Math.random() * foodmenu.soup.length)];
                break;
            case 3: // Others
            default:
                reply += foodmenu.others[Math.floor(Math.random() * foodmenu.others.length)];
        }
        interaction.reply(reply);
    }
}