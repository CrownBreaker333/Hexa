// CONVERSATION MEMORY
// Manages per-user multi-turn context for AI responses
//
// Two tiers of memory:
//   FREE    — last 6 messages (3 exchanges), in-memory only, not persisted
//   PREMIUM — last 20 messages, persisted to conversations.json across sessions
//   PRO     — last 40 messages, persisted to conversations.json across sessions
//
// This is separate from memoryManager.js which handles the /viewmemory log

const fs = require('fs');
const path = require('path');
const conversationPath = path.join(__dirname, '../data/conversations.json');

// In-memory store for FREE users — clears on restart, no disk I/O
const sessionMemory = new Map();

const HISTORY_LIMITS = {
    FREE: 6,       // 3 back-and-forth exchanges
    PREMIUM: 20,   // 10 exchanges, persisted
    PRO: 40        // 20 exchanges, persisted
};

// ─── Disk helpers (PREMIUM/PRO only) ─────────────────────────────────────────

function loadConversations() {
    if (!fs.existsSync(conversationPath)) {
        fs.writeFileSync(conversationPath, JSON.stringify({}));
    }
    try {
        return JSON.parse(fs.readFileSync(conversationPath, 'utf-8'));
    } catch (e) {
        console.error('[CONVERSATION] Failed to parse conversations.json:', e.message);
        return {};
    }
}

function saveConversations(data) {
    try {
        fs.writeFileSync(conversationPath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[CONVERSATION] Failed to write conversations.json:', e.message);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

// tier should be the result of getUserTier(userId) — 'FREE' | 'PREMIUM' | 'PRO'
function addMessage(userId, role, content, tier = 'FREE') {
    const limit = HISTORY_LIMITS[tier] || HISTORY_LIMITS.FREE;
    const entry = { role, content, timestamp: new Date().toISOString() };

    if (tier === 'FREE') {
        // Session only — no disk write
        const current = sessionMemory.get(userId) || [];
        current.push(entry);
        if (current.length > limit) current.splice(0, current.length - limit);
        sessionMemory.set(userId, current);
    } else {
        // Persisted for PREMIUM and PRO
        const data = loadConversations();
        if (!data[userId]) data[userId] = [];
        data[userId].push(entry);
        if (data[userId].length > limit) {
            data[userId] = data[userId].slice(-limit);
        }
        saveConversations(data);
    }
}

// Returns history formatted for Groq — only { role, content }, no timestamp
function getConversationHistory(userId, tier = 'FREE') {
    let history;

    if (tier === 'FREE') {
        history = sessionMemory.get(userId) || [];
    } else {
        const data = loadConversations();
        history = data[userId] || [];
    }

    // Strip timestamp before sending to Groq
    return history.map(m => ({ role: m.role, content: m.content }));
}

function clearConversation(userId, tier = 'FREE') {
    if (tier === 'FREE') {
        sessionMemory.delete(userId);
    } else {
        const data = loadConversations();
        delete data[userId];
        saveConversations(data);
    }
}

// Returns the raw history with timestamps for /viewmemory and /history commands
function getRawHistory(userId, tier = 'FREE') {
    if (tier === 'FREE') {
        return sessionMemory.get(userId) || [];
    }
    const data = loadConversations();
    return data[userId] || [];
}

module.exports = {
    addMessage,
    getConversationHistory,
    clearConversation,
    getRawHistory,
    HISTORY_LIMITS
};