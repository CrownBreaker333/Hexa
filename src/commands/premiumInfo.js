// PREMIUM INFO COMMAND
// Shows users what is coming soon for Hexa premium tiers

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premiuminfo')
        .setDescription('View what is coming soon to Hexa Premium'),

    async execute(interaction) {
        const freeEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Hexa — Current Access')
            .setDescription('Everything below is available to all users right now, for free.')
            .addFields(
                { name: 'What you have', value: 'Basic chat with Hexa\nPersonality customization\nResponse ratings\nConversation memory (session)\nContent moderation\nUsage stats', inline: false }
            );

        const comingSoonEmbed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('Coming Soon — Premium & Pro Tiers')
            .setDescription(
                'Hexa is still growing. Premium and Pro tiers are being built and will launch once the infrastructure is ready.\n\n' +
                'Use `/donate` to support development and help these features arrive sooner.'
            )
            .addFields(
                {
                    name: 'Premium (Coming Soon)',
                    value: 'Deeper conversation memory across sessions\nMultiple AI provider fallbacks\nIncreased daily command limit\nPriority support',
                    inline: false
                },
                {
                    name: 'Pro (Coming Soon)',
                    value: 'Image generation\nScheduled reminders and briefings\nFull analytics dashboard\nCustom personalities\nAdvanced guild settings\nUnlimited daily commands',
                    inline: false
                }
            )
            .setFooter({ text: 'Want to be notified when premium launches? Keep an eye on announcements.' });

        await interaction.reply({
            embeds: [freeEmbed, comingSoonEmbed],
            flags: 64
        });
    }
};