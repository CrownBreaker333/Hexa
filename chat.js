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
        .setDescription('Chat with HEXA AI in threads')
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

        console.log(`[CHAT] User: ${userId}, Channel: ${interaction.channel.name}, Type: ${interaction.channel.type}`);

        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply({
                content: `You have reached your daily limit of ${dailyLimit} messages.`
            });
        }

        const sanitizedQuestion = question.replace(/\/[a-z]+\s/gi, '').trim();

        try {
            console.log(`[CHAT] Getting AI response...`);
            const answer = await askAI(userId, sanitizedQuestion, guildId);
            console.log(`[CHAT] AI response received`);
            
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

            // Try to create thread
            console.log(`[CHAT] Attempting to create thread...`);
            const thread = await createThread(interaction, userId);
            console.log(`[CHAT] Thread result: ${thread ? thread.name : 'null'}`);

            if (thread) {
                console.log(`[CHAT] Sending message to thread...`);
                await thread.send({ embeds: [responseEmbed], components: [ratingRow] });
                await interaction.editReply({ content: `Chat sent to thread: ${thread.name}` });
                console.log(`[CHAT] Success - message sent to thread`);
            } else {
                console.log(`[CHAT] No thread - posting to channel instead`);
                await interaction.editReply({ embeds: [responseEmbed], components: [ratingRow] });
                console.log(`[CHAT] Success - message sent to channel`);
            }

        } catch (err) {
            console.error('Chat error:', err);
            await interaction.editReply('Something went wrong. Try again.');
        }
    }
};

async function createThread(interaction, userId) {
    try {
        const channel = interaction.channel;
        console.log(`[THREADS] Channel type: ${channel.type}, Has threads: ${!!channel.threads}`);

        if (!channel.threads) {
            console.log(`[THREADS] Channel does not support threads`);
            return null;
        }

        const threadName = `Chat — ${interaction.user.username}`;
        console.log(`[THREADS] Looking for existing thread: ${threadName}`);

        const existing = channel.threads.cache.find(t => t.name === threadName && !t.archived);
        if (existing) {
            console.log(`[THREADS] Found existing thread`);
            return existing;
        }

        console.log(`[THREADS] Creating new thread...`);
        const newThread = await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 60
        });
        console.log(`[THREADS] Thread created successfully: ${newThread.name}`);
        return newThread;

    } catch (error) {
        console.error(`[THREADS] Error: ${error.message}`);
        return null;
    }
}