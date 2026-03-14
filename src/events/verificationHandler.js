const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const verificationSystem = require('../utils/verificationSystem');

async function handleMathSubmit(interaction) {
    const challengeId = interaction.customId.replace('verify_math_', '');
    const userAnswer = interaction.fields.getTextInputValue('math_answer');

    console.log(`[VERIFY] Math submitted: challengeId=${challengeId}, answer=${userAnswer}`);

    const result = verificationSystem.verifyMathAnswer(challengeId, userAnswer);

    if (!result.success && result.reason === 'Challenge expired') {
        return interaction.reply({
            content: 'Your verification challenge has expired. Type `/verify` to try again.',
            flags: 64
        });
    }

    if (!result.success && result.reason === 'Too many wrong attempts') {
        return interaction.reply({
            content: 'Too many wrong attempts. Type `/verify` to try again.',
            flags: 64
        });
    }

    if (!result.success && result.reason === 'Wrong answer') {
        return interaction.reply({
            content: `Wrong answer! Try again. (${result.attempts}/3 attempts)`,
            flags: 64
        });
    }

    if (!result.success) {
        return interaction.reply({
            content: `Verification failed: ${result.reason}. Type `/verify` to try again.`,
            flags: 64
        });
    }

    const { code, codeId } = verificationSystem.generateDMCode(result.userId, result.guildId);

    try {
        const user = await interaction.client.users.fetch(result.userId);
        const dmEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('HEXA Verification Step 2')
            .setDescription(
                `You've passed Step 1!\n\n` +
                `Your verification code:\n` +
                `## \`${code}\`\n\n` +
                `Expires in 5 minutes • One-time use`
            )
            .setFooter({ text: 'HEXA Verification 2.0' })
            .setTimestamp();

        const confirmButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_confirm_${codeId}`)
                .setLabel('Confirm Code')
                .setStyle(ButtonStyle.Success)
        );

        await user.send({
            embeds: [dmEmbed],
            components: [confirmButton]
        });

        await interaction.reply({
            content: `Step 1 complete! Check your DMs for the code.`,
            flags: 64
        });
    } catch (e) {
        console.error('[VERIFY] DM send failed:', e.message);
        await interaction.reply({
            content: 'Could not send DM. Enable DMs and try `/verify` again.',
            flags: 64
        });
    }
}

async function handleDMCodeConfirm(interaction) {
    const codeId = interaction.customId.replace('verify_confirm_', '');

    const modal = new ModalBuilder()
        .setCustomId(`verify_code_modal_${codeId}`)
        .setTitle('Confirm Code');

    const codeInput = new TextInputBuilder()
        .setCustomId('verification_code')
        .setLabel('Enter your 8-character code')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. A1B2C3D4')
        .setRequired(true)
        .setMinLength(8)
        .setMaxLength(8);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    await interaction.showModal(modal);
}

async function handleCodeSubmit(interaction) {
    const codeId = interaction.customId.replace('verify_code_modal_', '');
    const submittedCode = interaction.fields.getTextInputValue('verification_code').toUpperCase();

    const result = verificationSystem.verifyDMCode(codeId, submittedCode, interaction.user.id);

    if (!result.success) {
        return interaction.reply({
            content: `Failed: ${result.reason}. Type `/verify` to restart.`,
            flags: 64
        });
    }

    const guild = interaction.client.guilds.cache.get(result.guildId);
    if (!guild) {
        return interaction.reply({
            content: 'Error: Server not found.',
            flags: 64
        });
    }

    const successEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('Verification Complete!')
        .setDescription(
            `Welcome to the Hexa Dev Hub!\n\n` +
            `You've been verified and now have full access to all channels.\n\n` +
            `Start exploring and enjoy Hexa!`
        )
        .setFooter({ text: 'HEXA Verification 2.0' })
        .setTimestamp();

    await interaction.reply({
        embeds: [successEmbed],
        flags: 64
    });

    try {
        const member = await guild.members.fetch(interaction.user.id);
        const guildId = result.guildId;
        
        const verifiedRoleId = process.env[`VERIFIED_ROLE_${guildId}`];
        const unverifiedRoleId = process.env[`UNVERIFIED_ROLE_${guildId}`];

        console.log(`[VERIFY] Guild ID: ${guildId}`);
        console.log(`[VERIFY] Looking for: VERIFIED_ROLE_${guildId}`);
        console.log(`[VERIFY] Verified role ID: ${verifiedRoleId}`);
        console.log(`[VERIFY] Unverified role ID: ${unverifiedRoleId}`);
        console.log(`[VERIFY] All env vars:`, Object.keys(process.env).filter(k => k.includes('ROLE')));

        if (verifiedRoleId) {
            const verifiedRole = guild.roles.cache.get(verifiedRoleId);
            if (verifiedRole) {
                await member.roles.add(verifiedRole);
                console.log(`[VERIFY] Added Verified role`);
            } else {
                console.log(`[VERIFY] Verified role not found in guild`);
            }
        }
        
        if (unverifiedRoleId) {
            const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
            if (unverifiedRole) {
                await member.roles.remove(unverifiedRole);
                console.log(`[VERIFY] Removed Unverified role`);
            }
        }

    } catch (e) {
        console.error('[VERIFY] Verification error:', e.message);
    }
}

module.exports = { handleMathSubmit, handleDMCodeConfirm, handleCodeSubmit };