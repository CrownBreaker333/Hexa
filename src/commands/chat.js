const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Create a new conversation thread with HEXA'),

    async execute(interaction) {
        const threadName = `Chat — ${interaction.user.username}`;

        try {
            const thread = await interaction.channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                reason: 'HEXA conversation thread'
            });

            await interaction.reply({
                content: `Thread created! Go to ${thread} and use \`/assistant [message]\` to start chatting with HEXA.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('[CHAT] Error creating thread:', error);
            await interaction.reply({
                content: 'Failed to create thread. Try again later.',
                ephemeral: true
            });
        }
    }
};