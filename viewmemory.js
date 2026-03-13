const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserHistory } = require('../utils/memoryManager');

const MAX_FIELD_LENGTH = 900; // Discord limit is 1024 — stay safely under

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewmemory')
        .setDescription('View your stored conversation history'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const history = getUserHistory(userId);

        if (!history || history.length === 0) {
            return interaction.reply({ content: 'You have no stored conversation history.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Your Conversation History')
            .setDescription(`Showing last ${Math.min(history.length, 10)} of ${history.length} total entries.`)
            .setTimestamp();

        history.slice(-10).forEach((item, idx) => {
            const time = `<t:${Math.floor(new Date(item.timestamp).getTime() / 1000)}:R>`;

            // Truncate long questions and responses to avoid hitting Discord's 1024 char field limit
            const question = item.question?.length > 200
                ? item.question.substring(0, 200) + '...'
                : (item.question || 'Unknown');

            const response = item.response?.length > MAX_FIELD_LENGTH
                ? item.response.substring(0, MAX_FIELD_LENGTH) + '...'
                : (item.response || 'Unknown');

            embed.addFields({
                name: `${idx + 1}. ${time}`,
                value: `**Q:** ${question}\n**A:** ${response}`
            });
        });

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};