const { EmbedBuilder } = require('discord.js');
const { askAI } = require('../utils/aiClient');
const { incrementUsage, canUse } = require('../utils/limits');
const { getDailyLimit, getUserTier } = require('../utils/premium');
const { saveConversation } = require('../utils/memoryManager');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages and non-thread messages
        if (message.author.bot || !message.channel.isThread()) return;

        // Check if message mentions HEXA
        const hexaMention = message.mentions.has(message.client.user);
        if (!hexaMention) return;

        const userId = message.author.id;
        const guildId = message.guildId;
        const tier = getUserTier(userId);

        // Remove bot mention from message
        const userMessage = message.content
            .replace(`<@${message.client.user.id}>`, '')
            .replace(`<@!${message.client.user.id}>`, '')
            .trim();

        if (!userMessage) {
            await message.reply('Say something after mentioning me!').catch(() => {});
            return;
        }

        // Check daily limit
        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            await message.reply(`You've reached your daily limit of ${dailyLimit} messages.`).catch(() => {});
            return;
        }

        try {
            // Show typing
            await message.channel.sendTyping();

            // Get AI response
            const answer = await askAI(userId, userMessage, guildId);
            incrementUsage(userId);

            // Save to memory
            try {
                saveConversation(userId, userMessage, answer);
            } catch (e) {
                console.error('Error saving conversation:', e);
            }

            // Truncate if needed
            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...'
                : answer;

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: message.client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] }).catch(() => {});

            console.log(`[THREAD-CHAT] Response sent to @mention in thread: ${message.channel.name}`);

        } catch (error) {
            console.error('Thread chat error:', error);
            await message.reply('Something went wrong. Try again.').catch(() => {});
        }
    }
};