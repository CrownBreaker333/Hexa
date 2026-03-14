// RESPONSE RATINGS
// Tracks user thumbs-up/down on AI responses
// Uses dataManager and in-memory cache

const { loadJSON, saveJSON } = require('./dataManager');

const RATINGS_FILE = 'ratings.json';

let cache = null;

function load() {
    if (cache) return cache;
    cache = loadJSON(RATINGS_FILE);
    return cache;
}

function save(data) {
    cache = data;
    saveJSON(RATINGS_FILE, data);
}

function rateResponse(messageId, userId, rating, personality, category = 'general') {
    const data = load();

    if (!data[category]) data[category] = {};
    if (!data[category][personality]) {
        data[category][personality] = { thumbsUp: 0, thumbsDown: 0 };
    }

    if (rating === 'up') {
        data[category][personality].thumbsUp += 1;
    } else if (rating === 'down') {
        data[category][personality].thumbsDown += 1;
    }

    save(data);
    return data[category][personality];
}

function getPersonalityStats(personality, category = 'general') {
    const data = load();
    const stats = data[category]?.[personality];
    if (!stats) return { thumbsUp: 0, thumbsDown: 0, score: 0, total: 0 };

    const total = stats.thumbsUp + stats.thumbsDown;
    const score = total > 0 ? Math.round((stats.thumbsUp / total) * 100) : 0;
    return { ...stats, score, total };
}

function getAllStats() {
    return load();
}

module.exports = {
    rateResponse,
    getPersonalityStats,
    getAllStats
};