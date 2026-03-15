const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askAI } = require('../utils/aiClient');
const { incrementUsage, canUse } = require('../utils/limits');
const { getDailyLimit, getUserTier } = require('../utils/premium');
const { saveConversation } = require('../utils/memoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assistant')
        .setDescription('Chat with HEXA in a thread')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your message for HEXA')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        // Only works in threads
        if (!interaction.channel.isThread()) {
            return interaction.editReply('This command only works in chat threads. Use `/chat` to create one.');
        }

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const tier = getUserTier(userId);
        const message = interaction.options.getString('message');

        // Check daily limit
        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply(`You've reached your daily limit of ${dailyLimit} messages.`);
        }

        try {
            // Show typing
            await interaction.channel.sendTyping();

            // Get AI response
            const answer = await askAI(userId, message, guildId);
            incrementUsage(userId);

            // Save to memory
            try {
                saveConversation(userId, message, answer);
            } catch (e) {
                console.error('Error saving conversation:', e);
            }

            // Truncate if needed
            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...'
                : answer;

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: interaction.client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            console.log(`[ASSISTANT] Response sent in thread: ${interaction.channel.name}`);

        } catch (error) {
            console.error('Assistant error:', error);
            await interaction.editReply('Something went wrong. Try again.');
        }
    }
};