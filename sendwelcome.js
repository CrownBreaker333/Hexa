const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendwelcome')
        .setDescription('Send the welcome message to the current channel')
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        // Check if user is developer
        if (interaction.user.id !== process.env.DEV_ID) {
            return interaction.reply({ content: 'This command is restricted to the bot developer.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('Welcome to the Hexa Dev Hub!')
            .setDescription(
                `Now that you're verified, explore everything Hexa can do!\n\n` +
                `Type \`/help\` to see all available commands including:\n` +
                `• AI chat with \`/chat\`\n` +
                `• Weather information with \`/weather\`\n` +
                `• Server stats with \`/stats\`\n` +
                `• And much more!\n\n` +
                `**Start your journey with Hexa by typing \`/help\` and discovering what she can do for you.**`
            )
            .setFooter({ text: 'Hexa Dev Hub' })

        try {
            await interaction.channel.send({ embeds: [welcomeEmbed] });
            await interaction.editReply('Welcome message sent!');
        } catch (e) {
            console.error('[WELCOME] Failed to send message:', e.message);
            await interaction.editReply('Failed to send message. Make sure Hexa has Send Messages permission in this channel.');
        }
    }
};