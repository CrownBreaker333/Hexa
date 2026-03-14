const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const verificationSystem = require('../utils/verificationSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verificationdashboard')
        .setDescription('View HEXA Verification 2.0 threat logs and analytics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const guildId = interaction.guild.id;
        const suspiciousData = [...verificationSystem.suspiciousActivity.entries()]
            .filter(([key]) => key.startsWith(`${guildId}_`))
            .slice(0, 10);

        const activeChallenges = [...verificationSystem.activeChallenges.values()]
            .filter(c => c.guildId === guildId).length;

        const completedVerifications = [...verificationSystem.completedVerifications.values()]
            .filter(v => v.guildId === guildId && v.used).length;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('HEXA Verification 2.0 Dashboard')
            .setDescription(`Threat Analytics for ${interaction.guild.name}`)
            .addFields(
                {
                    name: 'Active Challenges',
                    value: `${activeChallenges} users currently verifying`,
                    inline: true
                },
                {
                    name: 'Completed Verifications',
                    value: `${completedVerifications} users verified today`,
                    inline: true
                },
                {
                    name: 'Suspicious Activity Flagged',
                    value: `${suspiciousData.length} incidents`,
                    inline: true
                }
            );

        if (suspiciousData.length > 0) {
            const suspiciousText = suspiciousData
                .map(([key, activities]) => {
                    const userId = key.split('_')[1];
                    const recentActivity = activities[activities.length - 1];
                    return `User <@${userId}>: ${recentActivity.reason} (${new Date(recentActivity.timestamp).toLocaleTimeString()})`;
                })
                .join('\n');

            embed.addFields({
                name: 'Recent Suspicious Activity',
                value: suspiciousText || 'None',
                inline: false
            });
        }

        embed
            .setFooter({ text: 'HEXA Verification 2.0 • Privacy-First Analytics' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};