const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Shows information about yourself'),

    async execute(interaction) {
        const { user, member } = interaction;

        const accountCreated = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
        const joinedServer = member?.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : 'Unknown';

        await interaction.reply({
            embeds: [{
                title: 'User Info',
                thumbnail: { url: user.displayAvatarURL({ size: 256 }) },
                fields: [
                    { name: 'Username', value: user.username, inline: true },
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                    { name: 'Account Created', value: accountCreated, inline: true },
                    { name: 'Joined Server', value: joinedServer, inline: true }
                ],
                color: 0x5865F2
            }],
            flags: 64
        });
    }
};