// PERSONAL HISTORY COMMAND
// Shows a user their private paginated chat history with Hexa
// Uses consistent data structure throughout — no field mismatch on pagination

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserHistory } = require('../utils/memoryManager');

const PER_PAGE = 5;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('personalhistory')
        .setDescription('View your private chat history with Hexa')
        .addNumberOption(opt =>
            opt.setName('page')
                .setDescription('Page number to view (default: 1)')
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const userId = interaction.user.id;

        let history;
        try {
            history = getUserHistory(userId);
        } catch (e) {
            console.error('[PERSONALHISTORY] Failed to load history:', e);
            return interaction.editReply({ content: 'Could not load your chat history. Please try again.' });
        }

        if (!history || history.length === 0) {
            return interaction.editReply({ content: 'You have no chat history with Hexa yet. Start a conversation with /chat.' });
        }

        const totalPages = Math.ceil(history.length / PER_PAGE);
        const requestedPage = interaction.options.getNumber('page') || 1;
        const page = Math.min(requestedPage, totalPages);

        const buildEmbed = (currentPage) => {
            const start = (currentPage - 1) * PER_PAGE;
            const entries = history.slice(start, start + PER_PAGE);

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('Your Chat History')
                .setDescription(`Page ${currentPage} of ${totalPages} — ${history.length} total entries`)
                .setTimestamp();

            entries.forEach((entry, i) => {
                // Support both data shapes gracefully
                const question = entry.question || entry.userMessage || entry.content || 'Unknown';
                const response = entry.response || entry.hexaResponse || entry.reply || 'Unknown';
                const timestamp = entry.timestamp || entry.storedAt || entry.createdAt;
                const timeStr = timestamp ? `<t:${Math.floor(new Date(timestamp).getTime() / 1000)}:f>` : 'Unknown time';

                // Truncate to avoid Discord 1024 char field limit
                const q = question.length > 200 ? question.substring(0, 200) + '...' : question;
                const r = response.length > 400 ? response.substring(0, 400) + '...' : response;

                embed.addFields({
                    name: `${start + i + 1}. ${timeStr}`,
                    value: `**You:** ${q}\n**Hexa:** ${r}`,
                    inline: false
                });
            });

            return embed;
        };

        const buildButtons = (currentPage) => {
            const row = new ActionRowBuilder();

            if (currentPage > 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ph_prev_${userId}_${currentPage}`)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            if (currentPage < totalPages) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ph_next_${userId}_${currentPage}`)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            return row.components.length > 0 ? [row] : [];
        };

        const message = await interaction.editReply({
            embeds: [buildEmbed(page)],
            components: buildButtons(page)
        });

        if (buildButtons(page).length === 0) return;

        let currentPage = page;

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === userId && (
                i.customId.startsWith('ph_prev_') || i.customId.startsWith('ph_next_')
            ),
            time: 120_000
        });

        collector.on('collect', async btn => {
            if (btn.customId.includes('prev')) currentPage--;
            else if (btn.customId.includes('next')) currentPage++;

            await btn.update({
                embeds: [buildEmbed(currentPage)],
                components: buildButtons(currentPage)
            });
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
};