const { SlashCommandBuilder } = require('discord.js');
const { getUserHistory, clearUserHistory, deleteLastEntry, deleteEntryByIndex } = require('../utils/memoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletememory')
        .setDescription('Delete entries from your conversation history')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Which entries to delete')
                .setRequired(true)
                .addChoices(
                    { name: 'Last entry', value: 'last' },
                    { name: 'All entries', value: 'all' },
                    { name: 'By index', value: 'index' }
                )
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Index of the entry to delete (required if action is By index)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const action = interaction.options.getString('action');
        const index = interaction.options.getInteger('index');

        const history = getUserHistory(userId);
        if (!history || history.length === 0) {
            return interaction.reply({ content: 'You have no conversation history to delete.', flags: 64 });
        }

        if (action === 'last') {
            deleteLastEntry(userId);
            return interaction.reply({ content: 'Last conversation entry deleted.', flags: 64 });
        }

        if (action === 'all') {
            clearUserHistory(userId);
            return interaction.reply({ content: 'All conversation history has been cleared.', flags: 64 });
        }

        if (action === 'index') {
            if (index === null || index < 0 || index >= history.length) {
                return interaction.reply({
                    content: `Invalid index. Please provide a number between 0 and ${history.length - 1}.`,
                    flags: 64
                });
            }
            deleteEntryByIndex(userId, index);
            return interaction.reply({ content: `Entry at index ${index} deleted.`, flags: 64 });
        }
    }
};