// COMMAND LIMITS
// Tracks daily usage per user and enforces per-tier limits
// Uses dataManager for consistent file handling

const { loadJSON, saveJSON } = require('./dataManager');
const { isDeveloper } = require('./permissions');

const LIMITS_FILE = 'limits.json';

function load() {
    return loadJSON(LIMITS_FILE);
}

function save(data) {
    saveJSON(LIMITS_FILE, data);
}

function todayUTC() {
    return new Date().toISOString().split('T')[0];
}

function incrementUsage(userId) {
    if (isDeveloper(userId)) return 0;
    const data = load();
    const today = todayUTC();

    if (!data[userId] || data[userId].date !== today) {
        data[userId] = { date: today, count: 0 };
    }

    data[userId].count += 1;
    save(data);
    return data[userId].count;
}

function getUsage(userId) {
    const data = load();
    const today = todayUTC();
    if (!data[userId] || data[userId].date !== today) return 0;
    return data[userId].count;
}

function canUse(userId, limit) {
    if (isDeveloper(userId)) return true;
    return getUsage(userId) < limit;
}

module.exports = {
    incrementUsage,
    getUsage,
    canUse
};