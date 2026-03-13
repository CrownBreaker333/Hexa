// RESPONSE CACHE
// Caches AI responses to reduce API calls for repeated questions
// Prompts are stored as MD5 hashes only — plaintext is never written to disk

const { loadJSON, saveJSON } = require('./dataManager');
const crypto = require('crypto');

const CACHE_FILE = 'cache.json';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache so repeated hits don't touch disk at all
let cache = null;

function load() {
    if (cache) return cache;
    cache = loadJSON(CACHE_FILE);
    return cache;
}

function save(data) {
    cache = data;
    saveJSON(CACHE_FILE, data);
}

function hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex');
}

function getCachedResponse(prompt) {
    const hash = hashPrompt(prompt);
    const data = load();

    if (!data[hash]) return null;

    const entry = data[hash];
    const age = Date.now() - new Date(entry.timestamp).getTime();

    if (age >= CACHE_TTL_MS) {
        delete data[hash];
        save(data);
        return null;
    }

    return entry.response;
}

function setCachedResponse(prompt, response) {
    // Never cache error responses
    if (!response || response.includes('having trouble') || response.startsWith('Sorry')) return;

    const hash = hashPrompt(prompt);
    const data = load();

    // Store only the hash and response — no plaintext prompt stored ever
    data[hash] = {
        response,
        timestamp: new Date().toISOString()
    };

    save(data);
}

function clearCache() {
    cache = {};
    saveJSON(CACHE_FILE, {});
}

// Prune expired entries — call this from index.js on startup to keep the file lean
function pruneExpired() {
    const data = load();
    const now = Date.now();
    let pruned = 0;

    for (const [hash, entry] of Object.entries(data)) {
        if (now - new Date(entry.timestamp).getTime() >= CACHE_TTL_MS) {
            delete data[hash];
            pruned++;
        }
    }

    if (pruned > 0) {
        save(data);
        console.log(`[CACHE] Pruned ${pruned} expired entries`);
    }
}

module.exports = {
    getCachedResponse,
    setCachedResponse,
    clearCache,
    pruneExpired
};