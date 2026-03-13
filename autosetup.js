const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosetup')
        .setDescription('Automatically set up HEXA in your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const guild = interaction.guild;

        try {
            // Step 1: Create channels
            const channels = await createChannels(guild);

            // Step 2: Create roles
            const roles = await createRoles(guild);

            // Step 3: Set up verification system
            await setupVerification(guild, channels, roles);

            // Step 4: Send welcome messages
            await sendWelcomeMessages(guild, channels);

            // Step 5: Set permissions
            await setChannelPermissions(guild, channels, roles);

            // Final confirmation
            const embed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('HEXA Auto Setup Complete!')
                .setDescription(
                    `Your server is now fully configured.\n\n` +
                    `Created:\n` +
                    `• #verify channel for verification\n` +
                    `• #announcements for updates\n` +
                    `• #rules for server rules\n` +
                    `• #hexa-dev-hub for AI chat\n` +
                    `• Verified role (green)\n` +
                    `• Unverified role (red)\n\n` +
                    `Users can now:\n` +
                    `• Run /verify to get access\n` +
                    `• Chat with HEXA using /chat\n` +
                    `• Check weather with /weather\n` +
                    `• Use all HEXA features!\n\n` +
                    `Everything is ready to go!`
                )
                .setFooter({ text: 'HEXA Auto Setup • Set up in seconds' });

            await interaction.editReply({ embeds: [embed] });

            console.log(`[AUTOSETUP] Server ${guild.name} (${guild.id}) fully configured`);

        } catch (error) {
            console.error('[AUTOSETUP] Error:', error.message);
            await interaction.editReply(`Setup failed: ${error.message}`);
        }
    }
};

async function createChannels(guild) {
    const channels = {};

    const channelConfigs = [
        { name: 'verify', topic: 'Verification system - Complete the 2-step process' },
        { name: 'announcements', topic: 'Important updates and announcements' },
        { name: 'rules', topic: 'Server rules and guidelines' },
        { name: 'hexa-dev-hub', topic: 'Chat with HEXA AI' }
    ];

    for (const config of channelConfigs) {
        try {
            const existing = guild.channels.cache.find(ch => ch.name === config.name);
            if (existing) {
                channels[config.name] = existing;
                console.log(`[AUTOSETUP] Using existing channel: #${config.name}`);
            } else {
                const created = await guild.channels.create({
                    name: config.name,
                    type: ChannelType.GuildText,
                    topic: config.topic
                });
                channels[config.name] = created;
                console.log(`[AUTOSETUP] Created channel: #${config.name}`);
            }
        } catch (e) {
            console.error(`[AUTOSETUP] Failed to create/find #${config.name}:`, e.message);
        }
    }

    return channels;
}

async function createRoles(guild) {
    const roles = {};

    const roleConfigs = [
        { name: 'Verified', color: 0x4CBB17 },
        { name: 'Unverified', color: 0xFF0000 }
    ];

    for (const config of roleConfigs) {
        try {
            const existing = guild.roles.cache.find(r => r.name === config.name);
            if (existing) {
                roles[config.name.toLowerCase()] = existing;
                console.log(`[AUTOSETUP] Using existing role: ${config.name}`);
            } else {
                const created = await guild.roles.create({
                    name: config.name,
                    color: config.color
                });
                roles[config.name.toLowerCase()] = created;
                console.log(`[AUTOSETUP] Created role: ${config.name}`);
            }
        } catch (e) {
            console.error(`[AUTOSETUP] Failed to create/find role ${config.name}:`, e.message);
        }
    }

    return roles;
}

async function setupVerification(guild, channels, roles) {
    try {
        // Store role IDs in process.env for verification system
        process.env[`VERIFIED_ROLE_${guild.id}`] = roles.verified?.id || '';
        process.env[`UNVERIFIED_ROLE_${guild.id}`] = roles.unverified?.id || '';
        process.env[`VERIFY_CHANNEL_${guild.id}`] = channels.verify?.id || '';

        console.log(`[AUTOSETUP] Verification system configured`);
    } catch (e) {
        console.error('[AUTOSETUP] Verification setup failed:', e.message);
    }
}

async function sendWelcomeMessages(guild, channels) {
    const rulesEmbed = new EmbedBuilder()
        .setColor(0x00D9FF)
        .setTitle('Welcome to HEXA Dev Hub')
        .setDescription(
            `Welcome! We're excited to have you here.\n\n` +
            `Getting Started:\n` +
            `1. Read the rules below\n` +
            `2. Go to #verify and complete verification\n` +
            `3. Explore the server and use HEXA!\n\n` +
            `Server Rules:\n` +
            `• Be respectful to all members\n` +
            `• No spam, self-promotion, or advertising\n` +
            `• No explicit or harmful content\n` +
            `• Follow Discord's Terms of Service\n` +
            `• English only in public channels\n\n` +
            `Have fun, be kind, and enjoy HEXA!`
        )
        .setFooter({ text: 'HEXA Dev Hub Rules' });

    const verifyEmbed = new EmbedBuilder()
        .setColor(0x00D9FF)
        .setTitle('HEXA Verification System')
        .setDescription(
            `To access the server, complete our 2-step verification:\n\n` +
            `Step 1: Answer a simple math question\n` +
            `Step 2: Enter a one-time code sent to your DMs\n\n` +
            `This keeps our server safe from bots and spam.\n\n` +
            `Ready? Type \`/verify\` to start!`
        )
        .setFooter({ text: 'HEXA Verification 2.0' });

    const announceEmbed = new EmbedBuilder()
        .setColor(0x00D9FF)
        .setTitle('Announcements')
        .setDescription(
            `Stay updated on HEXA developments.\n\n` +
            `This channel contains:\n` +
            `• New features and updates\n` +
            `• Bug fixes and improvements\n` +
            `• Important news\n` +
            `• Maintenance notices\n\n` +
            `Enable notifications to never miss an update.`
        )
        .setFooter({ text: 'HEXA Announcements' });

    const hexaEmbed = new EmbedBuilder()
        .setColor(0x00D9FF)
        .setTitle('Welcome to HEXA AI Chat')
        .setDescription(
            `Now that you're verified, explore everything HEXA can do!\n\n` +
            `Type \`/help\` to see all available commands including:\n` +
            `• AI chat with \`/chat\`\n` +
            `• Weather information with \`/weather\`\n` +
            `• Server stats with \`/stats\`\n` +
            `• And much more!\n\n` +
            `Start your journey with HEXA by typing \`/help\` and discovering what she can do for you.`
        )
        .setFooter({ text: 'HEXA Dev Hub' });

    try {
        if (channels.rules) await channels.rules.send({ embeds: [rulesEmbed] });
        if (channels.verify) await channels.verify.send({ embeds: [verifyEmbed] });
        if (channels.announcements) await channels.announcements.send({ embeds: [announceEmbed] });
        if (channels['hexa-dev-hub']) await channels['hexa-dev-hub'].send({ embeds: [hexaEmbed] });

        console.log('[AUTOSETUP] Welcome messages sent');
    } catch (e) {
        console.error('[AUTOSETUP] Failed to send messages:', e.message);
    }
}

async function setChannelPermissions(guild, channels, roles) {
    try {
        const verifiedRole = roles.verified;
        const unverifiedRole = roles.unverified;

        // Channels that need permission overrides
        const protectedChannels = ['hexa-dev-hub', 'announcements'];

        for (const channelName of protectedChannels) {
            const channel = channels[channelName];
            if (!channel) continue;

            // Deny @everyone
            await channel.permissionOverwrites.edit(guild.id, {
                ViewChannel: false
            });

            // Allow Verified role
            if (verifiedRole) {
                await channel.permissionOverwrites.edit(verifiedRole, {
                    ViewChannel: true
                });
            }

            console.log(`[AUTOSETUP] Permissions set for #${channelName}`);
        }
    } catch (e) {
        console.error('[AUTOSETUP] Permission setup failed:', e.message);
    }
}