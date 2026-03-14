// IMAGINE COMMAND
// Image generation — Coming Soon (Pro feature)

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('Generate an image from a prompt (Pro — Coming Soon)')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('Describe the image you want to generate')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.reply({
            content: 'Image generation is a Pro feature that is coming soon. Use `/donate` to help fund development.',
            flags: 64
        });
    }
};