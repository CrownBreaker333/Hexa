const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { chat } = require('../utils/aiClient');
const { detectTaskType } = require('../utils/taskDetector');
const { loadJSON, saveJSON } = require('../utils/dataManager');
const { getUserPersona } = require('../utils/personalities');

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
        const userMessage = interaction.options.getString('message');
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

        // IMMEDIATE RESPONSE (within 3 seconds)
        await interaction.reply({
            content: 'Processing your request...',
            ephemeral: false
        });

        try {
            // Detect task type
            const task = detectTaskType(userMessage);
            console.log(`[ASSISTANT] Task detected: ${task}`);

            // Get conversation history
            const conversations = loadJSON('conversations.json');
            const userHistory = conversations[userId] || [];

            // Limit to last 20 messages for context
            const limitedHistory = userHistory.slice(-20);

            // Build messages array
            const messages = [
                ...limitedHistory,
                { role: 'user', content: userMessage }
            ];

            // Get user personality
            const persona = getUserPersona(userId, guildId);

            // GET AI RESPONSE (this can take time)
            console.log('[ASSISTANT] Waiting for AI response...');
            const response = await chat(messages, { task, userId });

            // Save to conversation history
            conversations[userId] = [
                ...(conversations[userId] || []),
                { role: 'user', content: userMessage },
                { role: 'assistant', content: response }
            ];
            saveJSON('conversations.json', conversations);

            console.log(`[ASSISTANT] Response generated (${response.length} chars)`);

            // CREATE EMBED RESPONSE
            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setDescription(response)
                .setFooter({ text: `Personality: ${persona} | Task: ${task}` });

            // EDIT THE INITIAL REPLY WITH ACTUAL RESPONSE
            await interaction.editReply({ 
                content: null,
                embeds: [embed] 
            });

            // Setup natural chat listener
            setupNaturalChat(interaction, userId, guildId);

        } catch (error) {
            console.error('[ASSISTANT] Error:', error);
            
            // EDIT WITH ERROR MESSAGE
            await interaction.editReply({
                content: `Error: ${error.message}`,
            }).catch(() => {
                // If edit fails, just log it
                console.error('[ASSISTANT] Could not edit reply');
            });
        }
    }
};

function setupNaturalChat(interaction, userId, guildId) {
    const filter = m => m.author.id === userId && !m.author.bot;
    const collector = interaction.channel.createMessageCollector({
        filter,
        idle: 3600000 // 1 hour idle timeout
    });

    console.log(`[NATURAL CHAT] Listener started for ${userId}`);

    collector.on('collect', async (msg) => {
        try {
            // Show typing indicator
            await interaction.channel.sendTyping();

            // Detect task
            const task = detectTaskType(msg.content);

            // Get history
            const conversations = loadJSON('conversations.json');
            const userHistory = conversations[userId] || [];
            const limitedHistory = userHistory.slice(-20);

            const messages = [
                ...limitedHistory,
                { role: 'user', content: msg.content }
            ];

            // Get response
            const response = await chat(messages, { task, userId });

            // Save history
            conversations[userId] = [
                ...(conversations[userId] || []),
                { role: 'user', content: msg.content },
                { role: 'assistant', content: response }
            ];
            saveJSON('conversations.json', conversations);

            const persona = getUserPersona(userId, guildId);

            // Send response
            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setDescription(response)
                .setFooter({ text: `Personality: ${persona} | Task: ${task}` });

            await msg.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[NATURAL CHAT] Error:', error);
            await msg.reply(`Sorry, I had trouble responding. Error: ${error.message}`);
        }
    });

    collector.on('end', (collected) => {
        console.log(`[NATURAL CHAT] Listener ended for ${userId} (collected ${collected.size} messages)`);
    });
}