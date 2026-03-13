const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupverification')
        .setDescription('Configure automatic verification for your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const guildId = interaction.guild.id;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('HEXA Verification 2.0 Setup')
            .setDescription(
                `Follow these steps to enable automatic verification:\n\n` +
                `1. Select the **Verify Channel** (where users see the welcome message)\n` +
                `2. Select the **Unverified Role** (given to new members until they verify)\n` +
                `3. Select the **Verified Role** (given after successful verification)\n\n` +
                `Then configure your channels to restrict access.`
            )
            .setFooter({ text: 'HEXA Verification 2.0 Setup Wizard' })
            .setTimestamp();

        const channelSelect = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('setup_verify_channel')
                .setPlaceholder('Select verification channel')
        );

        const roleSelect1 = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('setup_unverified_role')
                .setPlaceholder('Select Unverified role')
        );

        const roleSelect2 = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('setup_verified_role')
                .setPlaceholder('Select Verified role')
        );

        await interaction.editReply({
            embeds: [embed],
            components: [channelSelect, roleSelect1, roleSelect2]
        });

        interaction.guildId = guildId;
    }
};