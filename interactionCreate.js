const { Events } = require('discord.js');
const { isDeveloper } = require('../utils/permissions');
const { logCommand } = require('../utils/logger');
const { handleMathSubmit, handleDMCodeConfirm, handleCodeSubmit } = require('./verificationHandler');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        // ── Verification Math Modal ────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId.startsWith('verify_math_')) {
            console.log('[VERIFY] Handling math modal...');
            try {
                return await handleMathSubmit(interaction);
            } catch (e) {
                console.error('[VERIFY] Math error:', e.message);
            }
        }

        // ── Verification Confirm Button ────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('verify_confirm_')) {
            console.log('[VERIFY] Handling confirm button...');
            try {
                return await handleDMCodeConfirm(interaction);
            } catch (e) {
                console.error('[VERIFY] Confirm error:', e.message);
            }
        }

        // ── Verification Code Modal ────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId.startsWith('verify_code_modal_')) {
            console.log('[VERIFY] Handling code modal...');
            try {
                return await handleCodeSubmit(interaction);
            } catch (e) {
                console.error('[VERIFY] Code error:', e.message);
            }
        }

        // ── Setup Verification Handlers ────────────────────────────
        if (interaction.isChannelSelectMenu() && interaction.customId === 'setup_verify_channel') {
            const channel = interaction.values[0];
            process.env[`VERIFY_CHANNEL_${interaction.guild.id}`] = channel;
            return interaction.reply({
                content: `Verify channel set to <#${channel}>`,
                flags: 64
            });
        }

        if (interaction.isRoleSelectMenu() && interaction.customId === 'setup_unverified_role') {
            const role = interaction.values[0];
            process.env[`UNVERIFIED_ROLE_${interaction.guild.id}`] = role;
            return interaction.reply({
                content: `Unverified role set to <@&${role}>`,
                flags: 64
            });
        }

        if (interaction.isRoleSelectMenu() && interaction.customId === 'setup_verified_role') {
            const role = interaction.values[0];
            process.env[`VERIFIED_ROLE_${interaction.guild.id}`] = role;
            return interaction.reply({
                content: `Verified role set to <@&${role}>. Setup complete!`,
                flags: 64
            });
        }

        // ── Slash Commands ─────────────────────────────────────────
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command found for: ${interaction.commandName}`);
            return interaction.reply({
                content: 'Unknown command.',
                flags: 64
            });
        }

        if (command.devOnly && !isDeveloper(interaction.user.id)) {
            return interaction.reply({
                content: 'Dev only.',
                flags: 64
            });
        }

        if (command.adminOnly && !interaction.member?.permissions.has('Administrator') && !isDeveloper(interaction.user.id)) {
            return interaction.reply({
                content: 'Admin only.',
                flags: 64
            });
        }

        logCommand(interaction);

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error: /${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error.', flags: 64 }).catch(() => {});
            } else {
                await interaction.reply({ content: 'Error.', flags: 64 }).catch(() => {});
            }
        }
    }
};