// PERSONALITY MANAGER
// Manages HEXA's personality system (per-user AND per-server)

const { loadJSON, saveJSON } = require('./dataManager');

const PERSONALITIES_FILE = 'personalities.json';
const SERVER_PERSONALITIES_FILE = 'server_personalities.json';

const AVAILABLE_PERSONAS = [
    'default',      // Balanced, helpful
    'friendly',     // Warm, encouraging
    'professional', // Polished, precise
    'funny',        // Playful, witty
    'serious',      // Focused, direct
    'tutor',        // Patient, educational
    'creative',     // Imaginative, artistic
    'casual'        // Laid-back, chill
];

let userCache = null;
let serverCache = null;

function loadUsers() {
    if (userCache) return userCache;
    userCache = loadJSON(PERSONALITIES_FILE);
    return userCache;
}

function loadServers() {
    if (serverCache) return serverCache;
    serverCache = loadJSON(SERVER_PERSONALITIES_FILE);
    return serverCache;
}

function saveUsers(data) {
    userCache = data;
    saveJSON(PERSONALITIES_FILE, data);
}

function saveServers(data) {
    serverCache = data;
    saveJSON(SERVER_PERSONALITIES_FILE, data);
}

// ─── USER PERSONALITY ────────────────────────────────────────

function setUserPersona(userId, persona) {
    if (!AVAILABLE_PERSONAS.includes(persona)) {
        return { success: false, error: `Invalid persona. Choose from: ${AVAILABLE_PERSONAS.join(', ')}` };
    }
    const data = loadUsers();
    data[userId] = persona;
    saveUsers(data);
    return { success: true };
}

function getUserPersona(userId, guildId = null) {
    // Check server personality first (if guildId provided)
    if (guildId) {
        const serverPersona = getServerPersona(guildId);
        if (serverPersona !== 'default') {
            return serverPersona;
        }
    }
    // Fall back to user personality
    return loadUsers()[userId] || 'default';
}

// ─── SERVER PERSONALITY ──────────────────────────────────────

function setServerPersona(guildId, persona) {
    if (!AVAILABLE_PERSONAS.includes(persona)) {
        return { success: false, error: `Invalid persona. Choose from: ${AVAILABLE_PERSONAS.join(', ')}` };
    }
    const data = loadServers();
    data[guildId] = persona;
    saveServers(data);
    return { success: true };
}

function getServerPersona(guildId) {
    return loadServers()[guildId] || 'default';
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────

function listAvailablePersonas() {
    return [...AVAILABLE_PERSONAS];
}

function getPersonaDescription(persona) {
    const descriptions = {
        default: ' Balanced, helpful assistant',
        friendly: ' Warm, encouraging friend',
        professional: ' Polished, precise expert',
        funny: ' Playful, witty companion',
        serious: ' Focused, direct advisor',
        tutor: ' Patient, educational guide',
        creative: ' Imaginative, artistic thinker',
        casual: ' Laid-back, chill buddy'
    };
    return descriptions[persona] || 'Unknown personality';
}

module.exports = {
    setUserPersona,
    getUserPersona,
    setServerPersona,
    getServerPersona,
    listAvailablePersonas,
    getPersonaDescription,
    AVAILABLE_PERSONAS
};