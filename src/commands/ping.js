const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if Hexa is responsive and see latency'),

    async execute(interaction) {
        // Send a temporary message
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        // Calculate Hexa's response latency
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        // Get API latency
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Edit reply with actual results

        await interaction.editReply(`Pong!\n latency: ${latency}ms\nAPI latency: ${apiLatency}ms`);
    },
};