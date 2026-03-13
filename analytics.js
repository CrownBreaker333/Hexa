// USAGE ANALYTICS
// Tracks Hexa usage patterns and statistics
// In-memory cache with 60-second periodic flush — no longer blocks the event loop on every AI call

const { loadJSON, saveJSON } = require('./dataManager');

const ANALYTICS_FILE = 'analytics.json';

const DEFAULT_DATA = {
    totalQueries: 0,
    queriesByPersonality: {},
    queriesByHour: {},
    topUsers: {},
    avgResponseTime: 0
};

// Load once at startup, flush to disk on interval
let cache = null;

function load() {
    if (cache) return cache;
    const data = loadJSON(ANALYTICS_FILE);
    // Merge with defaults so old files missing new keys still work
    cache = { ...DEFAULT_DATA, ...data };
    return cache;
}

function flush() {
    if (cache) saveJSON(ANALYTICS_FILE, cache);
}

// Flush every 60 seconds instead of on every single AI response
setInterval(flush, 60_000);

// Also flush on clean shutdown
process.on('beforeExit', flush);
process.on('SIGINT', () => { flush(); process.exit(0); });
process.on('SIGTERM', () => { flush(); process.exit(0); });

function trackQuery(userId, personality, responseTime) {
    const data = load();
    const hour = new Date().getHours();

    data.totalQueries += 1;

    // Guard against null/undefined personality (e.g. if persona lookup fails)
    const key = personality || 'default';
    data.queriesByPersonality[key] = (data.queriesByPersonality[key] || 0) + 1;

    data.queriesByHour[hour] = (data.queriesByHour[hour] || 0) + 1;

    data.topUsers[userId] = (data.topUsers[userId] || 0) + 1;

    // Rolling average — safe even when totalQueries was just set to 1
    if (data.totalQueries === 1) {
        data.avgResponseTime = responseTime;
    } else {
        data.avgResponseTime = Math.round(
            (data.avgResponseTime * (data.totalQueries - 1) + responseTime) / data.totalQueries
        );
    }
}

function getAnalytics() {
    return load();
}

function getTopPersonalities(limit = 5) {
    return Object.entries(load().queriesByPersonality)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([personality, count]) => ({ personality, count }));
}

function getPeakHours() {
    return Object.entries(load().queriesByHour)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
}

function getTopUsers(limit = 10) {
    return Object.entries(load().topUsers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([userId, count]) => ({ userId, count }));
}

module.exports = {
    trackQuery,
    getAnalytics,
    getTopPersonalities,
    getPeakHours,
    getTopUsers
};