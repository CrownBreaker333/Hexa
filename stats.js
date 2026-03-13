const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display server and bot statistics'),

    async execute(interaction) {
        const guild = interaction.guild;
        const memberCount = guild.memberCount;
        // guild.members.cache may not have all members — use memberCount for humans estimate
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const humanCount = memberCount - botCount;

        const uptime = interaction.client.uptime;
        const s = Math.floor(uptime / 1000);
        const uptimeString = `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;

        const mem = process.memoryUsage();
        const memUsed = Math.round(mem.heapUsed / 1024 / 1024);
        const memTotal = Math.round(mem.heapTotal / 1024 / 1024);

        await interaction.reply({
            embeds: [{
                title: 'Server and Bot Stats',
                fields: [
                    { name: 'Members', value: `Total: ${memberCount}\nHumans: ${humanCount}\nBots: ${botCount}`, inline: true },
                    { name: 'Uptime', value: uptimeString, inline: true },
                    { name: 'Memory', value: `Used: ${memUsed}MB / ${memTotal}MB`, inline: true },
                    { name: 'Servers', value: `${interaction.client.guilds.cache.size}`, inline: true }
                ],
                color: 0x5865F2
            }]
        });
    }
};