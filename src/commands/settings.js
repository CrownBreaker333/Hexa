// SETTINGS COMMAND
// Guild configuration for admins
// Subcommands: view, personality, moderation (coming soon)

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings } = require('../utils/guildSettings');
const { setUserPersona, getUserPersona } = require('../utils/personalities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure Hexa for this server')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View current Hexa settings for this server')
        )
        .addSubcommand(sub =>
            sub.setName('personality')
                .setDescription('Set your personal AI personality')
                .addStringOption(opt =>
                    opt.setName('personality')
                        .setDescription('Choose a personality style')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Default',      value: 'default' },
                            { name: 'Friendly',     value: 'friendly' },
                            { name: 'Professional', value: 'professional' },
                            { name: 'Funny',        value: 'funny' },
                            { name: 'Serious',      value: 'serious' },
                            { name: 'Casual',       value: 'casual' },
                            { name: 'Tutor',        value: 'tutor' },
                            { name: 'Creative',     value: 'creative' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('moderation')
                .setDescription('Configure content moderation (Coming Soon)')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId  = interaction.user.id;
        const guildId = interaction.guild.id;

        if (subcommand === 'view') {
            const settings = getGuildSettings(guildId);
            const currentPersona = getUserPersona(userId);

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('Hexa Settings')
                .addFields(
                    { name: 'Your Personality', value: currentPersona.charAt(0).toUpperCase() + currentPersona.slice(1), inline: true },
                    { name: 'Guild Daily Limit', value: `${settings.dailyLimit || 20} messages`, inline: true },
                    { name: 'Moderation',        value: 'Coming Soon', inline: true }
                )
                .setFooter({ text: 'Use /settings personality to change your AI personality' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'personality') {
            const personality = interaction.options.getString('personality');
            setUserPersona(userId, personality);

            const label = personality.charAt(0).toUpperCase() + personality.slice(1);
            return interaction.reply({
                content: `Your personality has been set to **${label}**. Hexa will use this style in all future conversations with you.`,
                flags: 64
            });
        }

        if (subcommand === 'moderation') {
            return interaction.reply({
                content: 'Moderation configuration is coming in a future update.',
                flags: 64
            });
        }
    }
};