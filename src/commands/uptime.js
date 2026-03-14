const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Check how long Hexa has been online'),

    async execute(interaction) {
        const uptime = interaction.client.uptime; // ms — built into discord.js client, always available
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const uptimeString = `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;

        await interaction.reply({
            content: `Hexa has been online for: **${uptimeString}**`,
            flags: 64
        });
    }
};