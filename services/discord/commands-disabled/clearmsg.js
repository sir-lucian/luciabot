const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearmsg')
        .setDescription('Clear messages from user or bot in the channel.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Specify a user to delete their messages only')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') ?? null;
        const channel = interaction.channel;

        let deletedCount = 0;
        let result = '';
        let lastId = null;

        while (true) {
            // Fetch up to 100 messages
            const options = { limit: 100 };
            const messages = await channel.messages.fetch(options);

            if (messages.size === 0) {
                result = `No more messages to delete.`;
                break;
            }

            if (messages.last() && (messages.last().id === lastId)) {
                result = `No more messages to delete.`;
                break;
            } else {
                lastId = messages.last().id;
            }

            // Filter out the deferred reply message from this interaction
            let filtered = messages.filter(msg => msg.interaction?.id !== interaction.id);

            // If a user is specified, further filter for their messages
            if (targetUser) {
                filtered = filtered.filter(msg => msg.author.id === targetUser.id);
            }

            if (filtered.size === 0) {
                result = `No more messages to delete.`;
                break;
            }

            try {
                await channel.bulkDelete(filtered, true);
                deletedCount += filtered.size;
            } catch (error) {
                result = `Error deleting messages: ${error.message}`;
                break;
            }
            // Bulk delete
            
            // Wait a bit to avoid rate limits
            await new Promise(res => setTimeout(res, 1000));
        }

        return result || `✅ Deleted ${deletedCount} message(s) ${targetUser ? `from ${targetUser.username}` : 'in this channel'}.`;
    }
};