const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendverify')
        .setDescription('Send the verification info message to the verify channel')
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        // Check if user is developer
        if (interaction.user.id !== process.env.DEV_ID) {
            return interaction.reply({ content: 'This command is restricted to the bot developer.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        const verifyEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Welcome to Server Verification')
            .setDescription(
                `To gain access to all channels, you need to complete verification using **HEXA Verification 2.0**.\n\n` +
                `**How to verify:**\n` +
                `1. Type \`/verify\` in this channel\n` +
                `2. Click the button and solve the sequence puzzle (6 buttons in order)\n` +
                `3. Check your DMs for a verification code\n` +
                `4. Enter the code to confirm\n\n` +
                `**That's it!** You'll instantly get access to the Hexa Dev Hub.\n\n` +
                `If you have any issues, contact a moderator.`
            )
            .setFooter({ text: 'HEXA Verification 2.0 • Advanced Security' })

        try {
            await interaction.channel.send({ embeds: [verifyEmbed] });
            await interaction.editReply('Verification message sent!');
        } catch (e) {
            console.error('[VERIFY] Failed to send message:', e.message);
            await interaction.editReply('Failed to send message. Make sure Hexa has Send Messages permission in this channel.');
        }
    }
};