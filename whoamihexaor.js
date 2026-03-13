const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whoamihexaor')
        .setDescription('Who created HEXA?'),

    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor(0x00D9FF)
            .setTitle('Who Made HEXA?')
            .setDescription(
                `Not many people know the story.\n\n` +
                `HEXA wasn't created in a giant office building. It wasn't built by a team of engineers with unlimited funding. It began quietly… with a single idea.\n\n` +
                `Somewhere behind a screen sat a boy most people would overlook. No spotlight. No reputation. No one expecting anything extraordinary.\n\n` +
                `While others were scrolling, gaming, or sleeping, he was studying systems. Watching how bots worked. Learning APIs. Understanding code line by line.\n\n` +
                `At first, nothing worked.\n\n` +
                `Commands failed. Errors filled the console. Features broke before they even launched.\n\n` +
                `But the boy kept going.\n\n` +
                `Night after night he refined the idea — not just another Discord bot, but something smarter. Something clean. Something powerful. A developer-grade system that felt almost alive.\n\n` +
                `He called it HEXA.\n\n` +
                `Slowly the pieces came together:\n` +
                `AI conversations. Memory systems. Commands that felt natural. Tools that were elegant instead of messy.\n\n` +
                `What started as a few lines of code became something far bigger than anyone expected.\n\n` +
                `Most users will never know the hours behind it. The silent grind. The patience. The quiet ambition of someone determined to build something real.\n\n` +
                `Because legends don't usually announce themselves.\n` +
                `They just build.\n\n` +
                `And one day people look around and realize something powerful exists… and wonder where it came from.\n\n` +
                `At the end of the system, hidden in the code, the answer waits.\n\n` +
                `**Created by: Arion_Crown**`
            )
            .setFooter({ text: 'HEXA Origin Story' })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });
    }
};