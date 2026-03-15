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
        
        if (!channel.isTextBased()) {
            return interaction.editReply('This command only works in text channels.');
        }

        try {
            let deleted = 0;

            // Fetch and delete all active threads
            const activeThreads = await channel.threads.fetchActive();
            
            if (activeThreads.threads && activeThreads.threads.length > 0) {
                for (const thread of activeThreads.threads) {
                    try {
                        await thread.delete();
                        deleted++;
                        console.log(`[THREADS] Deleted: ${thread.name}`);
                    } catch (err) {
                        console.error(`[THREADS] Failed to delete: ${err.message}`);
                    }
                }
            }

            await interaction.editReply(`✅ Deleted ${deleted} thread(s)!`);

        } catch (error) {
            console.error('[THREADS] Error:', error.message);
            await interaction.editReply(`Error: ${error.message}`);
        }
    }
};