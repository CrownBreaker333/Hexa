const chalk = require('chalk');

function getTimestamp() {
    const now = new Date();
    return new Date().toISOString().split('.')[0] + 'Z';
}

function logCommand(interaction) {
    const user = interaction.user.tag;
    const command = interaction.commandName;
    const server = interaction.guild ? interaction.guild.name : "DM";
    const channel = interaction.channel ? interaction.channel.name : "Unknown Channel";
    const timeStamp = getTimestamp();

    console.log(`[${chalk.green(timeStamp)}] ${chalk.magenta('[COMMAND]')} ${user} used /${command} in ${server} #${channel}`);
}

function logError(error) {
    const timeStamp = getTimestamp();
    console.error(`[${chalk.red(timeStamp)}] [ERROR] ${error}`);
}

function logSystem(message) {
    const timeStamp = getTimestamp();
    console.log(`[${chalk.blue(timeStamp)}] ${chalk.cyan('[SYSTEM]')} ${message}`);
}

module.exports = {
    logCommand,
    logError,
    logSystem
};