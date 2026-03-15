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
                        let msg = `User <@${userId}> flagged.`;
                        devUser.send(msg).catch(() => {});
                    })
                    .catch(() => {});
            }
        }

        try {
            // Get or create thread
            const thread = await findOrCreateThread(interaction, userId);

            if (!thread) {
                return interaction.editReply('Failed to create thread.');
            }

            // Get AI response
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

            // Send to thread
            await thread.send({ embeds: [responseEmbed], components: [ratingRow] });

            // Reply to user
            const threadEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('Chat Started!')
                .setDescription(`Continue chatting in the thread — HEXA will respond automatically!`)
                .setFooter({ text: 'HEXA AI' });

            await interaction.editReply({ embeds: [threadEmbed] });

            // Set up message listener for continuous conversation
            setupThreadListener(thread, userId, guildId, tier);

            console.log(`[CHAT] Thread conversation started: ${thread.name}`);

        } catch (err) {
            console.error('Chat error:', err);
            await interaction.editReply('Something went wrong. Try again.');
        }
    }
};

async function findOrCreateThread(interaction, userId) {
    try {
        const channel = interaction.channel;

        if (!channel.threads) {
            return null;
        }

        const threadName = `Chat — ${interaction.user.username}`;
        const existing = channel.threads.cache.find(t => t.name === threadName && !t.archived);

        if (existing) {
            console.log(`[THREADS] Using existing thread: ${threadName}`);
            return existing;
        }

        const newThread = await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60
        });

        console.log(`[THREADS] Created new thread: ${threadName}`);
        return newThread;

    } catch (error) {
        console.error(`[THREADS] Error: ${error.message}`);
        return null;
    }
}

function setupThreadListener(thread, userId, guildId, tier) {
    // Listen for messages in this thread
    const collector = thread.createMessageCollector({
        filter: m => m.author.id === userId && !m.author.bot,
        time: 3600000 // 1 hour
    });

    collector.on('collect', async message => {
        try {
            const userMessage = message.content;

            // Check daily limit
            const dailyLimit = getDailyLimit(userId, guildId);
            if (!canUse(userId, dailyLimit)) {
                await thread.send(`You've reached your daily limit of ${dailyLimit} messages.`);
                return;
            }

            // Get AI response
            const answer = await askAI(userId, userMessage, guildId);
            incrementUsage(userId);

            // Save to memory
            try {
                saveConversation(userId, userMessage, answer);
            } catch (e) {
                console.error('Error saving:', e);
            }

            // Truncate if needed
            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...'
                : answer;

            const responseEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: message.client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            await thread.send({ embeds: [responseEmbed] });

            console.log(`[CHAT] Continuous response in thread`);

        } catch (error) {
            console.error('Thread listener error:', error);
            await thread.send('Something went wrong. Try again.').catch(() => {});
        }
    });

    collector.on('end', () => {
        console.log(`[THREADS] Listener ended for thread: ${thread.name}`);
    });
}