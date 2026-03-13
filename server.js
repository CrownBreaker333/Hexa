const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Shows information about this server'),

    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        await interaction.reply({
            embeds: [{
                title: guild.name,
                thumbnail: { url: guild.iconURL({ size: 256 }) || '' },
                fields: [
                    { name: 'Owner', value: owner.user.username, inline: true },
                    { name: 'Members', value: `${guild.memberCount}`, inline: true },
                    { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                    { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Server ID', value: guild.id, inline: true }
                ],
                color: 0x5865F2
            }],
            flags: 64
        });
    }
};