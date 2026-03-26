const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosetup')
        .setDescription('⚡ Advanced server setup wizard - Configure your entire server in seconds!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guild = interaction.guild;

        // Step 1: Server Type Selection
        const typeEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🚀 HEXA Server Setup Wizard')
            .setDescription('**Step 1/9: What type of server are you creating?**\n\nSelect your server type to customize the setup experience.')
            .setFooter({ text: 'HEXA AutoSetup | Step 1 of 9' });

        const typeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('type_gaming')
                    .setLabel('🎮 Gaming')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('type_study')
                    .setLabel('📚 Study')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('type_business')
                    .setLabel('💼 Business')
                    .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('type_community')
                    .setLabel('👥 Community')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('type_creative')
                    .setLabel('🎨 Creative')
                    .setStyle(ButtonStyle.Primary)
            );

        const typeMessage = await interaction.editReply({
            embeds: [typeEmbed],
            components: [typeButtons]
        });

        // Collector for Step 1
        const typeCollector = typeMessage.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 300000,
            max: 1
        });

        typeCollector.on('collect', async (typeInteraction) => {
            const serverType = typeInteraction.customId.replace('type_', '');
            await typeInteraction.deferUpdate();

            // Step 2: Customize or Skip
            const confirmEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('📋 Server Type Selected')
                .setDescription(`**Step 2/9: Customize Channel Names**\n\nYou selected: **${serverType.toUpperCase()}** server\n\nPress "Customize" to edit channel names or "Skip" for defaults.`)
                .setFooter({ text: 'HEXA AutoSetup | Step 2 of 9' });

            const confirmButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`customize_${serverType}`)
                        .setLabel('✏️ Customize')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`skip_${serverType}`)
                        .setLabel('⏭️ Skip')
                        .setStyle(ButtonStyle.Secondary)
                );

            await typeMessage.edit({
                embeds: [confirmEmbed],
                components: [confirmButtons]
            });

            // Collector for Step 2
            const confirmCollector = typeMessage.createMessageComponentCollector({
                filter: i => i.user.id === userId,
                time: 300000,
                max: 1
            });

            confirmCollector.on('collect', async (confirmInteraction) => {
                if (confirmInteraction.customId.startsWith('customize_')) {
                    // Show modal
                    const defaultChannels = getDefaultChannels(serverType);
                    
                    const channelModal = new ModalBuilder()
                        .setCustomId(`modal_channels`)
                        .setTitle('Customize Channel Names');

                    channelModal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('general_name')
                                .setLabel('General Channel Name')
                                .setStyle(TextInputStyle.Short)
                                .setValue(defaultChannels.general)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('announcements_name')
                                .setLabel('Announcements Channel Name')
                                .setStyle(TextInputStyle.Short)
                                .setValue(defaultChannels.announcements)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('rules_name')
                                .setLabel('Rules Channel Name')
                                .setStyle(TextInputStyle.Short)
                                .setValue(defaultChannels.rules)
                                .setRequired(true)
                        )
                    );

                    await confirmInteraction.showModal(channelModal);

                    // Wait for modal submission
                    try {
                        const submitted = await confirmInteraction.awaitModalSubmit({ time: 300000 });
                        
                        const customChannels = {
                            general: submitted.fields.getTextInputValue('general_name'),
                            announcements: submitted.fields.getTextInputValue('announcements_name'),
                            rules: submitted.fields.getTextInputValue('rules_name')
                        };

                        await submitted.deferUpdate();
                        await performSetup(typeMessage, guild, serverType, customChannels);

                    } catch (error) {
                        console.error('[AUTOSETUP] Modal timeout or error:', error);
                    }

                } else if (confirmInteraction.customId.startsWith('skip_')) {
                    await confirmInteraction.deferUpdate();
                    const defaultChannels = getDefaultChannels(serverType);
                    await performSetup(typeMessage, guild, serverType, defaultChannels);
                }
            });
        });
    }
};

// ─── Helper Functions ───────────────────────────────────────────

function getDefaultChannels(serverType) {
    const templates = {
        gaming: { general: 'general', announcements: 'announcements', rules: 'rules' },
        study: { general: 'general', announcements: 'announcements', rules: 'rules' },
        business: { general: 'general', announcements: 'announcements', rules: 'rules' },
        community: { general: 'general', announcements: 'announcements', rules: 'rules' },
        creative: { general: 'general', announcements: 'announcements', rules: 'rules' }
    };
    return templates[serverType] || templates.community;
}

async function performSetup(message, guild, serverType, channels) {
    try {
        console.log(`[AUTOSETUP] Starting setup for ${serverType} server...`);

        // Show progress
        const progressEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('⚙️ Setting Up Your Server')
            .setDescription('**Creating roles and channels...**\n\n🔄 This may take a moment')
            .setFooter({ text: 'HEXA AutoSetup | Processing' });

        await message.edit({
            embeds: [progressEmbed],
            components: []
        });

        // Create roles
        const verifiedRole = await guild.roles.create({
            name: '✅ Verified',
            color: '#4CBB17',
            reason: 'HEXA AutoSetup'
        });

        const unverifiedRole = await guild.roles.create({
            name: '❌ Unverified',
            color: '#FF0000',
            reason: 'HEXA AutoSetup'
        });

        const moderatorRole = await guild.roles.create({
            name: '🛡️ Moderator',
            color: '#FFD700',
            reason: 'HEXA AutoSetup'
        });

        console.log(`[AUTOSETUP] ✓ Roles created`);

        // Create channels
        const createdChannels = {};

        for (const [key, name] of Object.entries(channels)) {
            const channel = await guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                reason: 'HEXA AutoSetup'
            });
            createdChannels[key] = channel;
        }

        console.log(`[AUTOSETUP] ✓ Channels created`);

        // Set permissions
        for (const channel of Object.values(createdChannels)) {
            await channel.permissionOverwrites.create(unverifiedRole, {
                ViewChannel: false,
                SendMessages: false
            });

            await channel.permissionOverwrites.create(verifiedRole, {
                ViewChannel: true,
                SendMessages: true
            });
        }

        console.log(`[AUTOSETUP] ✓ Permissions configured`);

        // Send welcome message
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🎉 Welcome to HEXA')
            .setDescription('This server has been set up with HEXA AI integration.\n\nUse `/chat` to start conversations with HEXA AI!')
            .addFields(
                { name: '📚 Getting Started', value: 'Type `/assistant hello` to test HEXA', inline: false },
                { name: '🔐 Verification', value: 'New members must verify first', inline: false },
                { name: '💡 Commands', value: 'Use `/help` to see all available commands', inline: false }
            )
            .setFooter({ text: 'HEXA AutoSetup Complete' });

        await createdChannels.general.send({ embeds: [welcomeEmbed] });

        console.log(`[AUTOSETUP] ✓ Welcome message sent`);

        // Final completion embed
        const completionEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('✅ Server Setup Complete!')
            .setDescription('**Your server is ready to go!**\n\nHEXA has automatically configured:')
            .addFields(
                { name: '✓ Roles Created', value: `✅ Verified\n❌ Unverified\n🛡️ Moderator`, inline: true },
                { name: '✓ Channels Created', value: Object.values(channels).join('\n'), inline: true },
                { name: '✓ Permissions Set', value: 'Unverified users can\'t see channels\nVerified users have full access', inline: false },
                { name: '✓ Features Enabled', value: 'AI chat • Verification • Moderation', inline: false }
            )
            .setFooter({ text: 'HEXA AutoSetup | Server ready for your community!' });

        await message.edit({
            embeds: [completionEmbed],
            components: []
        });

        console.log(`[AUTOSETUP] ✅ Setup complete for ${guild.name}`);

    } catch (error) {
        console.error('[AUTOSETUP] Error:', error);
        await message.edit({
            embeds: [new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Setup Failed')
                .setDescription(`Error: ${error.message}`)
            ],
            components: []
        });
    }
}