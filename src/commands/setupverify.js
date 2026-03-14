const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupverify')
        .setDescription('Send the verification info message to the verify channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const verifyChannelId = process.env.VERIFY_CHANNEL_ID;
        const verifyChannel = interaction.guild.channels.cache.get(verifyChannelId);

        if (!verifyChannel) {
            return interaction.editReply('Verify channel not configured. Run /setupverification first.');
        }

        const infoEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('Welcome to Server Verification')
            .setDescription(
                `This server uses **HEXA Verification 2.0** to keep our community safe.\n\n` +
                `Verification is quick and easy:`
            )
            .addFields(
                { name: 'Step 1: Combination Lock', value: 'Click the button below and solve a simple sequence puzzle.', inline: false },
                { name: 'Step 2: Confirm Your Account', value: 'Verify your Discord account via DM (one-time code).', inline: false },
                { name: 'Result', value: 'Instant access to all server channels!', inline: false }
            )
            .setFooter({ text: 'HEXA Verification 2.0 • Advanced Security' })
            .setTimestamp();

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_start_' + interaction.user.id)
                .setLabel('Start Verification')
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await verifyChannel.send({
                embeds: [infoEmbed],
                components: [button]
            });

            await interaction.editReply(`Sent verification info message to ${verifyChannel.toString()}. Pin it manually if you want!`);
            console.log(`[VERIFY] Sent info message to ${verifyChannel.name}`);
        } catch (e) {
            console.error('[VERIFY] Failed to send message:', e.message);
            return interaction.editReply('Failed to send verification message. Check permissions.');
        }
    }
};