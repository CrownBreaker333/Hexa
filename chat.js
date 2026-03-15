const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { askAI } = require('../utils/aiClient');
const { getUsage, incrementUsage, canUse } = require('../utils/limits');
const { getDailyLimit, getUserTier } = require('../utils/premium');
const { saveConversation } = require('../utils/memoryManager');
const { clearConversation } = require('../utils/conversation');
const { clearUserHistory } = require('../utils/memoryManager');
const { rateResponse } = require('../utils/ratings');
const { getUserPersona } = require('../utils/personalities');
const { flagProhibited } = require('../utils/flagSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Chat with HEXA AI')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question for HEXA')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const tier = getUserTier(userId);
        const question = interaction.options.getString('question');

        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply({
                content: `You have reached your daily limit of ${dailyLimit} messages.`
            });
        }

        const sanitizedQuestion = question.replace(/\/[a-z]+\s/gi, '').trim();

        const flagResult = flagProhibited(userId, guildId, sanitizedQuestion);
        if (flagResult && (flagResult.shouldKick || flagResult.shouldBan)) {
            const devId = process.env.DEV_ID;
            if (devId) {
                interaction.client.users.fetch(devId)
                    .then(devUser => {
                        let msg = `User <@${userId}> flagged (${flagResult.flagCount} flags).`;
                        if (flagResult.shouldBan) msg += ' Ban threshold reached.';
                        devUser.send(msg).catch(() => {});
                    })
                    .catch(() => {});
            }
        }

        try {
            const answer = await askAI(userId, sanitizedQuestion, guildId);
            incrementUsage(userId);

            try {
                saveConversation(userId, sanitizedQuestion, answer);
            } catch (e) {
                console.error('Error saving conversation:', e);
            }

            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...'
                : answer;

            const responseEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: interaction.client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            const ratingRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`rate_up_${interaction.id}`)
                        .setLabel('Helpful')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`rate_down_${interaction.id}`)
                        .setLabel('Not Helpful')
                        .setStyle(ButtonStyle.Secondary)
                );

            if (tier === 'PREMIUM' || tier === 'PRO') {
                ratingRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`clear_chat_${interaction.id}`)
                        .setLabel('Clear History')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            // Try to create thread, fallback to regular message if it fails
            let thread = await createThreadIfPossible(interaction, userId);

            if (thread) {
                await thread.send({ embeds: [responseEmbed], components: [ratingRow] });
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00D9FF).setDescription('Response sent in thread!')] });
                console.log(`[CHAT] Response sent in thread: ${thread.name}`);
            } else {
                await interaction.editReply({ embeds: [responseEmbed], components: [ratingRow] });
                console.log(`[CHAT] Response sent in channel (no thread support)`);
            }

        } catch (err) {
            console.error('Chat error:', err);
            await interaction.editReply('Something went wrong. Try again.');
        }
    }
};

async function createThreadIfPossible(interaction, userId) {
    try {
        const channel = interaction.channel;
        if (!channel || !channel.threads) return null;

        const threadName = `Chat — ${interaction.user.username}`;
        const existing = channel.threads.cache.find(t => t.name === threadName && !t.archived);

        if (existing) return existing;

        return await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60
        });
    } catch (e) {
        console.error('[THREADS] Failed:', e.message);
        return null;
    }
}