const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletethreads')
        .setDescription('DELETE ALL THREADS IN THIS CHANNEL (Admin only)'),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const devId = process.env.DEV_ID;
        if (interaction.user.id !== devId) {
            return interaction.editReply('Only the developer can use this command.');
        }

        const channel = interaction.channel;
        
        if (!channel.threads) {
            return interaction.editReply('This channel does not support threads.');
        }

        try {
            const threads = await channel.threads.fetchActive();
            const count = threads.size;

            if (count === 0) {
                return interaction.editReply('No active threads to delete.');
            }

            for (const [id, thread] of threads) {
                await thread.delete().catch(err => {
                    console.error(`Failed to delete thread ${id}:`, err.message);
                });
            }

            await interaction.editReply(`✅ Deleted ${count} thread(s)!`);
            console.log(`[ADMIN] Deleted ${count} threads`);

        } catch (error) {
            console.error('Delete threads error:', error);
            await interaction.editReply('Failed to delete threads.');
        }
    }
};