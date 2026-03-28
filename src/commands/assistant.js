const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { askAI } = require('../utils/aiClient');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assistant')
        .setDescription('Start a conversation with HEXA in this thread')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Your message to HEXA')
                .setRequired(true)
        ),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        // Check if in thread
        if (!interaction.channel.isThread()) {
            await interaction.reply({
                content: 'This command only works inside threads. Use `/chat` to create a thread first.',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        try {
            // Get AI response
            const response = await askAI(userId, message, guildId);

            // Create embed for response
            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setDescription(response)
                .setFooter({ text: `Responded to: ${interaction.user.username}` });

            await interaction.editReply({ embeds: [embed] });

            // Setup natural chat listener
            setupNaturalChat(interaction);

        } catch (error) {
            console.error('[ASSISTANT] Error:', error);
            await interaction.editReply({
                content: 'An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
};

function setupNaturalChat(interaction) {
    const filter = m => m.author.id === interaction.user.id && !m.author.bot;
    const collector = interaction.channel.createMessageCollector({
        filter,
        idle: 3600000 // 1 hour idle timeout
    });

    collector.on('collect', async (msg) => {
        try {
            await interaction.channel.sendTyping();
            const response = await askAI(msg.author.id, msg.content, interaction.guildId);

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setDescription(response)
                .setFooter({ text: `Responded to: ${msg.author.username}` });

            await msg.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[NATURAL CHAT] Error:', error);
        }
    });

    collector.on('end', () => {
        console.log('[NATURAL CHAT] Collector ended - timeout');
    });
}