// GUILD SETTINGS
// Manages per-guild configuration
// Uses dataManager for consistent file handling

const { loadJSON, saveJSON } = require('./dataManager');

const SETTINGS_FILE = 'guildSettings.json';

const DEFAULTS = {
    dailyLimit: 10,
    defaultPersonality: 'friendly',
    moderationEnabled: true,
    analyticsEnabled: true,
    allowImageGeneration: false, // off by default — requires guild PRO tier
    prefix: '/'
};

function load() {
    return loadJSON(SETTINGS_FILE);
}

function save(data) {
    saveJSON(SETTINGS_FILE, data);
}

function getGuildSettings(guildId) {
    const settings = load();
    // Spread defaults first so any new keys added to DEFAULTS are picked up automatically
    return { ...DEFAULTS, ...(settings[guildId] || {}) };
}

function updateGuildSettings(guildId, updates) {
    const settings = load();
    settings[guildId] = { ...getGuildSettings(guildId), ...updates };
    save(settings);
    return settings[guildId];
}

function setDailyLimit(guildId, limit) {
    return updateGuildSettings(guildId, { dailyLimit: limit });
}

function setDefaultPersonality(guildId, personality) {
    return updateGuildSettings(guildId, { defaultPersonality: personality });
}

function toggleModeration(guildId) {
    const current = getGuildSettings(guildId);
    return updateGuildSettings(guildId, { moderationEnabled: !current.moderationEnabled });
}

module.exports = {
    getGuildSettings,
    updateGuildSettings,
    setDailyLimit,
    setDefaultPersonality,
    toggleModeration,
    DEFAULTS
};