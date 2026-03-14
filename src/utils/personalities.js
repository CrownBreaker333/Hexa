// PERSONALITY MANAGER
// Manages Hexa's per-user personality selection
// Uses dataManager for consistent file handling

const { loadJSON, saveJSON } = require('./dataManager');

const PERSONALITIES_FILE = 'personalities.json';

const AVAILABLE_PERSONAS = ['default', 'friendly', 'professional', 'funny', 'serious'];

let cache = null;

function load() {
    if (cache) return cache;
    cache = loadJSON(PERSONALITIES_FILE);
    return cache;
}

function save(data) {
    cache = data;
    saveJSON(PERSONALITIES_FILE, data);
}

function setUserPersona(userId, persona) {
    if (!AVAILABLE_PERSONAS.includes(persona)) {
        return { success: false, error: `Invalid persona. Choose from: ${AVAILABLE_PERSONAS.join(', ')}` };
    }
    const data = load();
    data[userId] = persona;
    save(data);
    return { success: true };
}

function getUserPersona(userId) {
    return load()[userId] || 'default';
}

function listAvailablePersonas() {
    return [...AVAILABLE_PERSONAS];
}

module.exports = {
    setUserPersona,
    getUserPersona,
    listAvailablePersonas,
    AVAILABLE_PERSONAS
};