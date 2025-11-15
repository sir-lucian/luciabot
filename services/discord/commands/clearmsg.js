const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearmsg')
        .setDescription('Clear messages from user or bot in the channel.')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Specify a user to delete their messages only')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const channel = interaction.channel;

        await interaction.deferReply({ ephemeral: true });

        let deletedCount = 0;

        while (true) {
            // Fetch up to 100 messages
            const messages = await channel.messages.fetch({ limit: 100 });

            // Filter messages if user is specified
            const filtered = targetUser
                ? messages.filter(msg => msg.author.id === targetUser.id)
                : messages;

            if (filtered.size === 0) break; // Stop if nothing to delete

            // Bulk delete
            await channel.bulkDelete(filtered, true);
            deletedCount += filtered.size;

            // Wait a bit to avoid rate limits
            await new Promise(res => setTimeout(res, 1000));
        }

        await interaction.editReply(`✅ Deleted ${deletedCount} message(s) ${targetUser ? `from ${targetUser.tag}` : 'in this channel'}.`);
    }
};