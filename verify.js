const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const verificationSystem = require('../utils/verificationSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Start HEXA Verification 2.0'),

    async execute(interaction) {
        const challenge = verificationSystem.generateMathChallenge();
        
        const modal = new ModalBuilder()
            .setCustomId(`verify_math_${challenge.challengeId}`)
            .setTitle('HEXA Verification - Step 1');

        const answerInput = new TextInputBuilder()
            .setCustomId('math_answer')
            .setLabel(`What is ${challenge.question}?`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the answer')
            .setRequired(true)
            .setMaxLength(5);

        modal.addComponents(new ActionRowBuilder().addComponents(answerInput));
        
        try {
            // Store user/guild BEFORE showing modal
            verificationSystem.setUserForChallenge(challenge.challengeId, interaction.user.id, interaction.guild.id);
            await interaction.showModal(modal);
        } catch (e) {
            console.error('[VERIFY] Failed to show modal:', e.message);
            await interaction.reply({ content: 'Failed to start verification. Try again.', flags: 64 });
        }
    }
};