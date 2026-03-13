// DONATE COMMAND
// Shows a warm message encouraging users to support Hexa's development
// with a link to the donation page

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription("Support Hexa's development and help keep her growing!"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('Support Hexa')
            .setDescription(
                `Hey ${interaction.user}!\n\n` +
                `Hexa is a passion project built from the ground up — every feature, ` +
                `every command, and every response is crafted with care to give you ` +
                `the best experience possible.\n\n` +
                `**Your support means everything.** Even a small donation directly helps cover:\n` +
                `> AI API costs to keep Hexa responding\n` +
                `> Hosting to keep her online 24/7\n` +
                `> Development time to build new features\n\n` +
                `Every contribution helps shape what Hexa becomes next. ` +
                `Thank you for even considering it — it truly makes a difference.`
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({
                text: `Requested by ${interaction.user.username} • Thank you for your support!`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Donate to Hexa')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.DONATION_LINK || 'https://hexa-bot.com/donate'),
                new ButtonBuilder()
                    .setLabel('View Premium Plans')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.PREMIUM_LINK || 'https://hexa-bot.com/upgrade')
            );

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    }
};