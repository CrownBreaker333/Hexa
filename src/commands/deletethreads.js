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

        try {
            let deleted = 0;

            // Keep fetching and deleting until none left
            while (true) {
                const threads = await channel.threads.fetchActive();
                
                if (!threads || threads.size === 0) break;

                for (const [id, thread] of threads) {
                    try {
                        await thread.delete();
                        deleted++;
                        console.log(`[THREADS] Deleted: ${thread.name}`);
                    } catch (err) {
                        console.error(`[THREADS] Error deleting ${thread.name}:`, err.message);
                    }
                }
            }

            console.log(`[THREADS] Total deleted: ${deleted}`);
            await interaction.editReply(`✅ Deleted ${deleted} thread(s)!`);

        } catch (error) {
            console.error('[THREADS] Error:', error.message);
            await interaction.editReply(`Error: ${error.message}`);
        }
    }
};