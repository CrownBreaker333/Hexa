const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Create a new chat thread with HEXA'),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const userId = interaction.user.id;

        try {
            const channel = interaction.channel;

            if (!channel.threads) {
                return interaction.editReply('This channel does not support threads.');
            }

            const threadName = `Chat — ${interaction.user.username}`;
            
            // Check if thread already exists
            const existing = channel.threads.cache.find(t => t.name === threadName && !t.archived);

            if (existing) {
                const embed = new EmbedBuilder()
                    .setColor(0x00D9FF)
                    .setTitle('Thread Already Open')
                    .setDescription(`Your chat thread is already open. Go to the thread and use \`/assistant\` or mention \`@HEXA\` to start chatting!`)
                    .setFooter({ text: 'HEXA AI' });

                return interaction.editReply({ embeds: [embed] });
            }

            // Create new thread
            const newThread = await channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                reason: `Chat thread for ${interaction.user.username}`
            });

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('Chat Thread Created!')
                .setDescription(`Your thread is ready! Go to the thread and use:\n\n\`/assistant your message\`\n\nOR\n\n\`@HEXA your message\`\n\nto start chatting with HEXA.`)
                .setFooter({ text: 'HEXA AI' });

            await interaction.editReply({ embeds: [embed] });

            console.log(`[CHAT] Thread created: ${threadName}`);

        } catch (error) {
            console.error('Chat error:', error);
            await interaction.editReply('Failed to create thread. Try again.');
        }
    }
};