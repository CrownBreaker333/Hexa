const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const verificationSystem = require('../utils/verificationSystem');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member) {
        const guild = member.guild;
        const guildId = guild.id;

        // Get verification settings from guild data
        // For now, we'll use environment variables or hardcoded setup
        const unverifiedRoleId = process.env[`UNVERIFIED_ROLE_${guildId}`];
        const verifyChannelId = process.env[`VERIFY_CHANNEL_${guildId}`];

        if (!unverifiedRoleId || !verifyChannelId) {
            console.warn(`[VERIFY] Guild ${guildId} not set up for automatic verification. Run /setupverification first.`);
            return;
        }

        try {
            // Give them the Unverified role
            const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
            if (unverifiedRole) {
                await member.roles.add(unverifiedRole);
                console.log(`[VERIFY] Added Unverified role to ${member.user.username}`);
            }
        } catch (e) {
            console.error(`[VERIFY] Failed to add Unverified role: ${e.message}`);
        }

        // Send verification prompt in the verify channel
        const verifyChannel = guild.channels.cache.get(verifyChannelId);
        if (!verifyChannel) {
            console.error(`[VERIFY] Verify channel not found for guild ${guildId}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Welcome to the Server!')
            .setDescription(
                `Hey ${member}, welcome!\n\n` +
                `To access the server, you need to complete **HEXA Verification 2.0**.\n\n` +
                `This is a two-step process:\n` +
                `1. Click "Start Verification" and complete the combination lock challenge\n` +
                `2. Confirm your Discord account via DM\n\n` +
                `You have 5 minutes to complete each step. Good luck!`
            )
            .setFooter({ text: 'HEXA Verification 2.0 • Privacy-First' })
            .setTimestamp();

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_start_${member.id}`)
                .setLabel('Start Verification')
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await verifyChannel.send({
                content: `${member}`,
                embeds: [embed],
                components: [button]
            });
            console.log(`[VERIFY] Sent verification prompt to ${member.user.username}`);
        } catch (e) {
            console.error(`[VERIFY] Failed to send verification prompt: ${e.message}`);
        }
    }
};