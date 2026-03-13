// SCHEDULE COMMAND
// Scheduled reminders and briefings — Coming Soon (Pro feature)

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Set up scheduled reminders (Pro — Coming Soon)'),

    async execute(interaction) {
        await interaction.reply({
            content: 'Scheduled commands are a Pro feature that is coming soon. Use `/donate` to help fund development.',
            flags: 64
        });
    }
};