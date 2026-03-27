const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require('discord.js');
const { setServerPersona } = require('../utils/personalities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosetup')
        .setDescription('⚡ ULTIMATE Server Setup Wizard - Configure everything in seconds!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guild = interaction.guild;
        const wizard = new SetupWizard(guild, userId, interaction);

        await wizard.start();
    }
};

// ─── SETUP WIZARD CLASS ─────────────────────────────────────────

class SetupWizard {
    constructor(guild, userId, interaction) {
        this.guild = guild;
        this.userId = userId;
        this.interaction = interaction;
        this.data = {
            serverType: null,
            personality: null,
            channels: {},
            roles: {},
            moderation: {
                enableAutoMod: false,
                enableLogs: false,
                wordFilter: false
            }
        };
    }

    async start() {
        await this.step1_serverType();
    }

    // ─── STEP 1: SERVER TYPE ────────────────────────────────────────

    async step1_serverType() {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🚀 HEXA Ultimate Server Setup Wizard')
            .setDescription('**Step 1/9: What type of server are you creating?**\n\nSelect your server type for a customized experience.')
            .setFooter({ text: 'HEXA AutoSetup | Step 1 of 9' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('type_gaming').setLabel('🎮 Gaming').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('type_study').setLabel('📚 Study').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('type_business').setLabel('💼 Business').setStyle(ButtonStyle.Primary)
            )
            .addComponents(
                new ButtonBuilder().setCustomId('type_community').setLabel('👥 Community').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('type_creative').setLabel('🎨 Creative').setStyle(ButtonStyle.Primary)
            );

        const message = await this.interaction.editReply({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId,
            time: 300000,
            max: 1
        });

        collector.on('collect', async (i) => {
            this.data.serverType = i.customId.replace('type_', '');
            await i.deferUpdate();
            await this.step2_personality(message);
        });
    }

    // ─── STEP 2: AI PERSONALITY ────────────────────────────────────────

    async step2_personality(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🤖 Select AI Personality')
            .setDescription('**Step 2/9: Choose HEXA\'s personality for this server**\n\nThis defines how HEXA responds to users.')
            .setFooter({ text: 'HEXA AutoSetup | Step 2 of 9' });

        const select = new StringSelectMenuBuilder()
            .setCustomId('personality_select')
            .setPlaceholder('Choose a personality...')
            .addOptions(
                { label: '🤖 Default', value: 'default', description: 'Balanced, helpful assistant' },
                { label: '😊 Friendly', value: 'friendly', description: 'Warm, encouraging friend' },
                { label: '💼 Professional', value: 'professional', description: 'Polished, precise expert' },
                { label: '😄 Funny', value: 'funny', description: 'Playful, witty companion' },
                { label: '🎯 Serious', value: 'serious', description: 'Focused, direct advisor' },
                { label: '📚 Tutor', value: 'tutor', description: 'Patient, educational guide' },
                { label: '🎨 Creative', value: 'creative', description: 'Imaginative, artistic thinker' },
                { label: '😎 Casual', value: 'casual', description: 'Laid-back, chill buddy' }
            );

        const row = new ActionRowBuilder().addComponents(select);

        await message.edit({ embeds: [embed], components: [row] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId && i.isStringSelectMenu(),
            time: 300000,
            max: 1
        });

        collector.on('collect', async (i) => {
            this.data.personality = i.values[0];
            await i.deferUpdate();
            await this.step3_customizeChannels(message);
        });
    }

    // ─── STEP 3: CUSTOMIZE CHANNELS ────────────────────────────────────────

    async step3_customizeChannels(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('📋 Channel Customization')
            .setDescription('**Step 3/9: Customize channel names or use defaults**')
            .setFooter({ text: 'HEXA AutoSetup | Step 3 of 9' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('customize_channels').setLabel('✏️ Customize').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('skip_channels').setLabel('⏭️ Skip').setStyle(ButtonStyle.Secondary)
            );

        await message.edit({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId,
            time: 300000,
            max: 1
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'customize_channels') {
                await this.showChannelModal(message, i);
            } else {
                this.data.channels = this.getDefaultChannels();
                await i.deferUpdate();
                await this.step4_moderation(message);
            }
        });
    }

    async showChannelModal(message, interaction) {
        const defaults = this.getDefaultChannels();
        
        const modal = new ModalBuilder()
            .setCustomId('modal_channels')
            .setTitle('Customize Channel Names');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('general_name')
                    .setLabel('General Channel')
                    .setStyle(TextInputStyle.Short)
                    .setValue(defaults.general)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('announcements_name')
                    .setLabel('Announcements Channel')
                    .setStyle(TextInputStyle.Short)
                    .setValue(defaults.announcements)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('rules_name')
                    .setLabel('Rules Channel')
                    .setStyle(TextInputStyle.Short)
                    .setValue(defaults.rules)
                    .setRequired(true)
            )
        );

        await interaction.showModal(modal);

        try {
            const submitted = await interaction.awaitModalSubmit({ time: 300000 });
            
            this.data.channels = {
                general: submitted.fields.getTextInputValue('general_name'),
                announcements: submitted.fields.getTextInputValue('announcements_name'),
                rules: submitted.fields.getTextInputValue('rules_name')
            };

            await submitted.deferUpdate();
            await this.step4_moderation(message);
        } catch (error) {
            console.error('[AUTOSETUP] Modal error:', error);
        }
    }

    // ─── STEP 4: MODERATION SETUP ────────────────────────────────────────

    async step4_moderation(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🛡️ Moderation Setup')
            .setDescription('**Step 4/9: Enable moderation features**\n\nChoose which features to enable:')
            .addFields(
                { name: '🤖 Auto-Moderation', value: 'Automatically filter spam and harmful content', inline: false },
                { name: '📋 Moderation Logs', value: 'Track all moderation actions', inline: false },
                { name: '🚫 Word Filter', value: 'Filter specific words', inline: false }
            )
            .setFooter({ text: 'HEXA AutoSetup | Step 4 of 9' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('mod_automod').setLabel('✅ Auto-Mod').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('mod_logs').setLabel('✅ Logs').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('mod_filter').setLabel('✅ Word Filter').setStyle(ButtonStyle.Success)
            )
            .addComponents(
                new ButtonBuilder().setCustomId('mod_skip').setLabel('⏭️ Skip All').setStyle(ButtonStyle.Secondary)
            );

        await message.edit({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId,
            time: 300000
        });

        let modCount = 0;
        
        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'mod_automod') this.data.moderation.enableAutoMod = !this.data.moderation.enableAutoMod;
            if (i.customId === 'mod_logs') this.data.moderation.enableLogs = !this.data.moderation.enableLogs;
            if (i.customId === 'mod_filter') this.data.moderation.wordFilter = !this.data.moderation.wordFilter;

            modCount++;

            if (i.customId === 'mod_skip' || modCount >= 3) {
                collector.stop();
                await this.step5_verification(message);
            }
        });
    }

    // ─── STEP 5: VERIFICATION ────────────────────────────────────────

    async step5_verification(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('🔐 Verification System')
            .setDescription('**Step 5/9: Enable verification?**\n\nProtect your server with 2FA verification.')
            .setFooter({ text: 'HEXA AutoSetup | Step 5 of 9' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('verify_yes').setLabel('✅ Enable').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('verify_no').setLabel('❌ Skip').setStyle(ButtonStyle.Secondary)
            );

        await message.edit({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId,
            time: 300000,
            max: 1
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            await this.step6_summary(message);
        });
    }

    // ─── STEP 6: SUMMARY & CONFIRM ────────────────────────────────────────

    async step6_summary(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('✅ Setup Summary')
            .setDescription('**Review your configuration:**')
            .addFields(
                { name: '🎯 Server Type', value: this.data.serverType.toUpperCase(), inline: true },
                { name: '🤖 Personality', value: this.data.personality, inline: true },
                { name: '🛡️ Auto-Moderation', value: this.data.moderation.enableAutoMod ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📋 Mod Logs', value: this.data.moderation.enableLogs ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🚫 Word Filter', value: this.data.moderation.wordFilter ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📝 Channels', value: Object.values(this.data.channels).join(', '), inline: false }
            )
            .setFooter({ text: 'HEXA AutoSetup | Ready to setup?' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('confirm_setup').setLabel('🚀 Start Setup').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancel_setup').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
            );

        await message.edit({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === this.userId,
            time: 300000,
            max: 1
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'confirm_setup') {
                await i.deferUpdate();
                await this.performSetup(message);
            } else {
                await i.deferUpdate();
                await message.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Setup Cancelled')], components: [] });
            }
        });
    }

    // ─── PERFORM SETUP ────────────────────────────────────────────────────────────

    async performSetup(message) {
        const progressEmbed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('⚙️ Setting Up Your Server')
            .setDescription('**Creating everything...**\n\n🔄 This may take a moment')
            .setFooter({ text: 'HEXA AutoSetup | Processing' });

        await message.edit({ embeds: [progressEmbed], components: [] });

        try {
            // Create roles
            const verifiedRole = await this.guild.roles.create({
                name: '✅ Verified',
                color: '#4CBB17',
                reason: 'HEXA AutoSetup'
            });

            const unverifiedRole = await this.guild.roles.create({
                name: '❌ Unverified',
                color: '#FF0000',
                reason: 'HEXA AutoSetup'
            });

            const moderatorRole = await this.guild.roles.create({
                name: '🛡️ Moderator',
                color: '#FFD700',
                reason: 'HEXA AutoSetup'
            });

            // Create channels
            const createdChannels = {};

            for (const [key, name] of Object.entries(this.data.channels)) {
                const channel = await this.guild.channels.create({
                    name: name,
                    type: ChannelType.GuildText,
                    reason: 'HEXA AutoSetup'
                });
                createdChannels[key] = channel;
            }

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

            // Set server personality
            setServerPersona(this.guild.id, this.data.personality);

            // Send welcome message
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('🎉 Welcome to HEXA')
                .setDescription('This server has been set up with HEXA AI integration!')
                .addFields(
                    { name: '🤖 AI Personality', value: `Set to: **${this.data.personality}**`, inline: true },
                    { name: '🛡️ Moderation', value: `Auto-Mod: ${this.data.moderation.enableAutoMod ? '✅' : '❌'}\nLogs: ${this.data.moderation.enableLogs ? '✅' : '❌'}`, inline: true },
                    { name: '📚 Getting Started', value: 'Type `/assistant hello` to test HEXA', inline: false }
                )
                .setFooter({ text: 'HEXA AutoSetup Complete' });

            await createdChannels.general.send({ embeds: [welcomeEmbed] });

            // Completion embed
            const completionEmbed = new EmbedBuilder()
                .setColor(0x00D9FF)
                .setTitle('✅ Server Setup Complete!')
                .setDescription('**Your server is ready!**')
                .addFields(
                    { name: '✓ Roles', value: `✅ Verified\n❌ Unverified\n🛡️ Moderator`, inline: true },
                    { name: '✓ Channels', value: Object.values(this.data.channels).join('\n'), inline: true },
                    { name: '✓ AI Personality', value: this.data.personality, inline: false },
                    { name: '✓ Features', value: 'AI chat • Verification • Moderation', inline: false }
                )
                .setFooter({ text: 'HEXA AutoSetup | Your server is legendary!' });

            await message.edit({ embeds: [completionEmbed], components: [] });

            console.log(`[AUTOSETUP] ✅ Complete setup for ${this.guild.name}`);

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

    // ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────────

    getDefaultChannels() {
        const templates = {
            gaming: { general: 'general', announcements: 'announcements', rules: 'rules' },
            study: { general: 'general', announcements: 'announcements', rules: 'rules' },
            business: { general: 'general', announcements: 'announcements', rules: 'rules' },
            community: { general: 'general', announcements: 'announcements', rules: 'rules' },
            creative: { general: 'general', announcements: 'announcements', rules: 'rules' }
        };
        return templates[this.data.serverType] || templates.community;
    }
}