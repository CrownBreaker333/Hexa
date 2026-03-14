// PERMISSIONS
// Global permission checks for developer overrides

require('dotenv').config();

/**
 * Check if a user is the developer
 * @param {string} discordId - The Discord user ID
 * @returns {boolean} - True if the user is the developer
 */
function isDeveloper(discordId) {
    return discordId === process.env.DEV_ID;
}

module.exports = {
    isDeveloper
};