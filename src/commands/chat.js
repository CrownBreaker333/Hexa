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
        .setDescription('Chat with HEXA AI in an organized thread')
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

        // Check daily usage limit
        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply({
                content: `You have reached your daily limit of ${dailyLimit} messages. Your limit resets at midnight UTC.\n\nUpgrade to PREMIUM for 100/day or PRO for 1000/day — use \`/premiuminfo\` to learn more.`
            });
        }

        // Sanitize prompt
        const sanitizedQuestion = question.replace(/\/[a-z]+\s/gi, '').trim();

        // Flag check
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
            // Find or create thread
            let thread = await findOrCreateThread(interaction, userId);

            if (!thread) {
                return interaction.editReply('Failed to create chat thread. Try again.');
            }

            // Get AI response
            const answer = await askAI(userId, sanitizedQuestion, guildId);
            incrementUsage(userId);

            // Save to memory
            try {
                saveConversation(userId, sanitizedQuestion, answer);
            } catch (e) {
                console.error('Error saving conversation to memory:', e);
            }

            // Truncate if needed
            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...\n\n*(Response truncated)*'
                : answer;

            // Create response embed
            const responseEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: interaction.client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            // Rating buttons
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

            // Clear history button for premium users
            if (tier === 'PREMIUM' || tier === 'PRO') {
                ratingRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`clear_chat_${interaction.id}`)
                        .setLabel('Clear History')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            // Send to thread
            const threadMessage = await thread.send({
                embeds: [responseEmbed],
                components: [ratingRow]
            });

            // Reply to original interaction
            const threadEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('Chat Started!')
                .setDescription(`Your conversation is in the thread. Keep chatting there!`)
                .setFooter({ text: 'HEXA AI' });

            await interaction.editReply({ embeds: [threadEmbed] });

            // Button collector
            const collector = thread.createMessageComponentCollector({
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
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        ratingRow.components.map(btn =>
                            ButtonBuilder.from(btn.toJSON()).setDisabled(true)
                        )
                    );
                threadMessage.edit({ components: [disabledRow] }).catch(() => {});
            });

            console.log(`[CHAT] Response sent in thread: ${thread.name}`);

        } catch (err) {
            console.error('Chat command error:', err);
            await interaction.editReply({
                content: 'Something went wrong. Please try again.',
                components: []
            });
        }
    }
};

async function findOrCreateThread(interaction, userId) {
    try {
        const channel = interaction.channel;
        const user = interaction.user;

        // Safety check — make sure channel exists and supports threads
        if (!channel || !channel.threads) {
            console.error('[THREADS] Channel does not support threads');
            return null;
        }

        // Look for existing thread
        const threadName = `Chat — ${user.username}`;
        const existingThread = channel.threads.cache.find(t => t.name === threadName && !t.archived);

        if (existingThread) {
            console.log(`[THREADS] Using existing thread: ${existingThread.name}`);
            return existingThread;
        }

        // Create new thread
        const newThread = await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60,
            reason: `AI chat thread for ${user.username}`
        });

        console.log(`[THREADS] Created new thread: ${newThread.name}`);
        return newThread;

    } catch (error) {
        console.error('[THREADS] Error creating thread:', error.message);
        return null;
    }
}
