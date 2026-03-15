const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { askAI } = require('../utils/aiClient');
const { incrementUsage, canUse } = require('../utils/limits');
const { getDailyLimit, getUserTier } = require('../utils/premium');
const { saveConversation } = require('../utils/memoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assistant')
        .setDescription('Start chatting with HEXA in a thread')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your first message for HEXA')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        if (!interaction.channel.isThread()) {
            return interaction.editReply('This command only works in chat threads. Use `/chat` to create one.');
        }

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const tier = getUserTier(userId);
        const message = interaction.options.getString('message');

        const dailyLimit = getDailyLimit(userId, guildId);
        if (!canUse(userId, dailyLimit)) {
            return interaction.editReply(`Daily limit reached: ${dailyLimit} messages.`);
        }

        try {
            await interaction.channel.sendTyping();

            const answer = await askAI(userId, message, guildId);
            incrementUsage(userId);

            try {
                saveConversation(userId, message, answer);
            } catch (e) {
                console.error('Error saving:', e);
            }

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

            // Set up listener for natural conversation
            setupNaturalChat(interaction.channel, userId, guildId, tier, interaction.client);

            console.log(`[ASSISTANT] Started in thread: ${interaction.channel.name}`);

        } catch (error) {
            console.error('Assistant error:', error);
            await interaction.editReply('Something went wrong. Try again.');
        }
    }
};

function setupNaturalChat(thread, userId, guildId, tier, client) {
    const collector = thread.createMessageCollector({
        filter: m => m.author.id === userId && !m.author.bot,
        idle: 3600000
    });

    collector.on('collect', async message => {
        try {
            const userMessage = message.content;

            const dailyLimit = getDailyLimit(userId, guildId);
            if (!canUse(userId, dailyLimit)) {
                await thread.send(`Daily limit reached: ${dailyLimit} messages.`).catch(() => {});
                return;
            }

            await thread.sendTyping().catch(() => {});

            const answer = await askAI(userId, userMessage, guildId);
            incrementUsage(userId);

            try {
                saveConversation(userId, userMessage, answer);
            } catch (e) {
                console.error('Error saving:', e);
            }

            const truncatedAnswer = answer.length > 1700
                ? answer.substring(0, 1700) + '...'
                : answer;

            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setAuthor({ name: 'HEXA', iconURL: client.user.avatarURL() })
                .setDescription(truncatedAnswer)
                .setFooter({ text: `Tier: ${tier}` })
                .setTimestamp();

            await thread.send({ embeds: [embed] }).catch(err => {
                console.error('[CHAT] Failed to send:', err);
            });

            console.log(`[NATURAL-CHAT] Response in thread`);

        } catch (error) {
            console.error('[NATURAL-CHAT] Error:', error);
            await thread.send('Something went wrong.').catch(() => {});
        }
    });
}
```

---

**And delete `src/events/threadChat.js`** (the @HEXA one)

---

**Now the flow is:**
```
1. /chat → Creates thread
2. /assistant hello → HEXA responds, listener starts
3. User: tell me more → HEXA responds automatically
4. User: how are you → HEXA responds automatically
5. (continues for 1 hour of inactivity)