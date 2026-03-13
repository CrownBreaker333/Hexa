// MEMORY MANAGER
// Stores full chat Q&A pairs (user question + Hexa response) for /personalhistory
// This is the human-readable history, separate from conversation.js which is the AI context window
// Hard cap of 200 entries per user to prevent unbounded file growth

const { loadJSON, saveJSON } = require('./dataManager');

const HISTORY_FILE = 'memory.json';
const MAX_ENTRIES = 200;

// In-memory cache — memory.json can get large; only read it from disk once per session
let cache = null;

function load() {
    if (cache) return cache;
    cache = loadJSON(HISTORY_FILE);
    return cache;
}

function save(data) {
    cache = data;
    saveJSON(HISTORY_FILE, data);
}

function saveConversation(userId, question, response) {
    // Never save error strings into memory — they poison future AI context
    if (!response || response.startsWith('Sorry') || response.includes('having trouble')) return;

    const data = load();
    if (!data[userId]) data[userId] = [];

    data[userId].push({
        question,
        response,
        timestamp: new Date().toISOString()
    });

    // Enforce cap — drop oldest entries first
    if (data[userId].length > MAX_ENTRIES) {
        data[userId] = data[userId].slice(-MAX_ENTRIES);
    }

    save(data);
}

function getUserHistory(userId) {
    return load()[userId] || [];
}

function clearUserHistory(userId) {
    const data = load();
    if (!data[userId]) return false;
    delete data[userId];
    save(data);
    return true;
}

function deleteLastEntry(userId) {
    const data = load();
    if (!data[userId] || data[userId].length === 0) return false;
    data[userId].pop();
    save(data);
    return true;
}

function deleteEntryByIndex(userId, index) {
    const data = load();
    if (!data[userId] || index < 0 || index >= data[userId].length) return false;
    data[userId].splice(index, 1);
    save(data);
    return true;
}

module.exports = {
    saveConversation,
    getUserHistory,
    clearUserHistory,
    deleteLastEntry,
    deleteEntryByIndex
};