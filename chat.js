// CHAT COMMAND
// Core AI chat command - available to all users
// Premium features shown as "coming soon" until payment is integrated

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        .setDescription('Ask Hexa anything!')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question for Hexa')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Defer immediately — must be first to prevent interaction timeout
        // regardless of language, response speed, or check results
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const tier = getUserTier(userId);

        // Check daily usage limit — use editReply since we already deferred
        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply({
                content: `You have reached your daily limit of ${dailyLimit} messages. Your limit resets at midnight UTC.\n\nUpgrade to PREMIUM for 100/day or PRO for 1000/day — use \`/premiuminfo\` to learn more.`
            });
        }

        const question = interaction.options.getString('question');

        // Sanitize prompt — strip injected slash command attempts
        const sanitizedQuestion = question.replace(/\/[a-z]+\s/gi, '').trim();

        // Flag check — notifies dev if user hits thresholds
        const flagResult = flagProhibited(userId, guildId, sanitizedQuestion);
        if (flagResult && (flagResult.shouldKick || flagResult.shouldBan)) {
            const devId = process.env.DEV_ID;
            if (devId) {
                interaction.client.users.fetch(devId)
                    .then(devUser => {
                        let msg = `User <@${userId}> has been flagged (${flagResult.flagCount} flags).`;
                        if (flagResult.shouldBan) msg += ' Ban threshold reached.';
                        else if (flagResult.shouldKick) msg += ' Kick threshold reached.';
                        devUser.send(msg).catch(() => {});
                    })
                    .catch(() => {});
            }
        }

        try {
            const answer = await askAI(userId, sanitizedQuestion, guildId);
            incrementUsage(userId);

            // Save to memory log (for /viewmemory and /personalhistory)
            try {
                saveConversation(userId, sanitizedQuestion, answer);
            } catch (e) {
                console.error('Error saving conversation to memory:', e);
            }

            // Truncate response if over Discord's 2000 char limit
            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...\n\n*(Response truncated)*'
                : answer;

            // Show the user's question above Hexa's response for context
            const displayAnswer = `> ${sanitizedQuestion}\n\n${truncatedAnswer}`;

            // Rating buttons — added after streaming completes
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

            // Clear history button for PREMIUM and PRO users
            if (tier === 'PREMIUM' || tier === 'PRO') {
                ratingRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`clear_chat_${interaction.id}`)
                        .setLabel('Clear History')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            await interaction.editReply({
                content: displayAnswer,
                components: [ratingRow]
            });

            // Button collector — active for 5 minutes
            const collector = interaction.channel.createMessageComponentCollector({
                filter: i => i.user.id === userId && (
                    i.customId.startsWith('rate_') || i.customId.startsWith('clear_')
                ),
                time: 300_000,
                max: 1
            });

            collector.on('collect', async buttonInteraction => {
                if (buttonInteraction.customId.startsWith('rate_')) {
                    const rating = buttonInteraction.customId.includes('up') ? 'up' : 'down';
                    const persona = getUserPersona(userId);
                    rateResponse(interaction.id, userId, rating, persona);
                    await buttonInteraction.reply({
                        content: 'Thanks for the feedback!',
                        flags: 64
                    });
                } else if (buttonInteraction.customId.startsWith('clear_')) {
                    clearConversation(userId, tier);
                    clearUserHistory(userId);
                    await buttonInteraction.reply({
                        content: 'Conversation history cleared.',
                        flags: 64
                    });
                }
            });

            collector.on('end', () => {
                // Disable buttons after timeout
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        ratingRow.components.map(btn =>
                            ButtonBuilder.from(btn.toJSON()).setDisabled(true)
                        )
                    );
                interaction.editReply({ components: [disabledRow] }).catch(() => {});
            });

        } catch (err) {
            console.error('Chat command error:', err);
            await interaction.editReply({
                content: 'Something went wrong while processing your request. Please try again.',
                components: []
            });
        }
    }
};