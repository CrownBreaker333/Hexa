const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newchat')
        .setDescription('Start a completely fresh chat thread'),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        // Only works in threads
        if (!interaction.channel.isThread()) {
            return interaction.editReply('This command only works inside a chat thread. Use `/chat` to create one first.');
        }

        try {
            const channel = interaction.channel.parent;
            const userId = interaction.user.id;

            if (!channel.threads) {
                return interaction.editReply('Failed to create new thread.');
            }

            // Create new thread with timestamp for uniqueness
            const timestamp = Date.now();
            const threadName = `Chat — ${interaction.user.username} (${timestamp})`;

            const newThread = await channel.threads.create({
                name: threadName,
                autoArchiveDuration: 60,
                reason: `New chat thread for ${interaction.user.username}`
            });

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('Fresh Chat Started!')
                .setDescription(`New thread created! Go there and type:\n\n\`/assistant your message\`\n\nThen chat naturally.`)
                .setFooter({ text: 'HEXA AI' });

            await interaction.editReply({ embeds: [embed] });

            console.log(`[NEWCHAT] Fresh thread created: ${threadName}`);

        } catch (error) {
            console.error('Newchat error:', error);
            await interaction.editReply('Failed to create new thread. Try again.');
        }
    }
};