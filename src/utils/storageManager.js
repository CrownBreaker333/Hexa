// STORAGE MANAGER
// Manages user storage limits for free vs premium users
// In-memory cache with periodic flush to avoid blocking the event loop on every call

const { getDataPath } = require('./dataManager');
const { getUserTier } = require('./premium');
const fs = require('fs');

const storagePath = getDataPath('storage.json');

const STORAGE_LIMITS = {
    FREE: {
        maxItems: 10,
        maxMessages: 50,
        maxNicknames: 5,
        description: 'Free users can store up to 10 items and 50 messages'
    },
    PREMIUM: {
        maxItems: 100,
        maxMessages: 500,
        maxNicknames: 20,
        description: 'Premium users can store up to 100 items and 500 messages'
    },
    PRO: {
        maxItems: 500,
        maxMessages: 2000,
        maxNicknames: 50,
        description: 'Pro users get up to 500 items and 2000 messages'
    }
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Loaded once at startup, written to disk every 30 seconds
// This eliminates the full file read+write on every storage operation

let storageCache = null;

function loadStorage() {
    if (storageCache) return storageCache;
    if (!fs.existsSync(storagePath)) {
        fs.writeFileSync(storagePath, JSON.stringify({}));
    }
    try {
        storageCache = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    } catch (e) {
        console.error('[STORAGE] Failed to parse storage.json, resetting:', e.message);
        storageCache = {};
    }
    return storageCache;
}

function saveStorage(data) {
    storageCache = data;
    try {
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[STORAGE] Failed to write storage.json:', e.message);
    }
}

// Flush cache to disk every 30 seconds
setInterval(() => {
    if (storageCache) {
        try {
            fs.writeFileSync(storagePath, JSON.stringify(storageCache, null, 2));
        } catch (e) {
            console.error('[STORAGE] Periodic flush failed:', e.message);
        }
    }
}, 30_000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStorageLimits(userId) {
    const tier = getUserTier(userId);
    return STORAGE_LIMITS[tier] || STORAGE_LIMITS.FREE;
}

// Initialize user storage inline — no separate file operation
function ensureUserStorage(storage, userId) {
    if (!storage[userId]) {
        storage[userId] = {
            userId,
            items: [],
            messages: [],
            nicknames: {},
            preferences: {},
            createdAt: new Date().toISOString()
        };
    }
    return storage[userId];
}

// ─── Public API ───────────────────────────────────────────────────────────────

function initializeUserStorage(userId) {
    const storage = loadStorage();
    ensureUserStorage(storage, userId);
    saveStorage(storage);
    return storage[userId];
}

function storeItem(userId, item, category = 'general') {
    const storage = loadStorage();
    const userStorage = ensureUserStorage(storage, userId);
    const limits = getStorageLimits(userId);

    if (userStorage.items.length >= limits.maxItems) {
        return {
            success: false,
            error: `Storage limit reached. Maximum ${limits.maxItems} items for your tier.`
        };
    }

    userStorage.items.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, // unique enough for concurrent use
        category,
        content: item,
        storedAt: new Date().toISOString()
    });

    saveStorage(storage);
    return { success: true, totalItems: userStorage.items.length, limit: limits.maxItems };
}

function storeMessage(userId, message, context = 'chat') {
    const storage = loadStorage();
    const userStorage = ensureUserStorage(storage, userId);
    const limits = getStorageLimits(userId);

    if (userStorage.messages.length >= limits.maxMessages) {
        return {
            success: false,
            error: `Message limit reached. Maximum ${limits.maxMessages} messages for your tier.`
        };
    }

    userStorage.messages.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        context,
        content: message,
        storedAt: new Date().toISOString()
    });

    saveStorage(storage);
    return { success: true };
}

function storeNickname(userId, guildId, nickname) {
    const storage = loadStorage();
    const userStorage = ensureUserStorage(storage, userId);
    const limits = getStorageLimits(userId);

    if (Object.keys(userStorage.nicknames).length >= limits.maxNicknames) {
        return {
            success: false,
            error: `Nickname limit reached. Maximum ${limits.maxNicknames} nicknames for your tier.`
        };
    }

    userStorage.nicknames[guildId] = { nickname, storedAt: new Date().toISOString() };
    saveStorage(storage);
    return { success: true };
}

function getUserStorage(userId) {
    const storage = loadStorage();
    return storage[userId] || null;
}

function getUserItems(userId) {
    return getUserStorage(userId)?.items || [];
}

function getUserMessages(userId) {
    return getUserStorage(userId)?.messages || [];
}

function deleteItem(userId, itemId) {
    const storage = loadStorage();
    const userStorage = storage[userId];
    if (!userStorage) return { success: false, error: 'User storage not found' };

    const index = userStorage.items.findIndex(item => item.id === itemId);
    if (index === -1) return { success: false, error: 'Item not found' };

    userStorage.items.splice(index, 1);
    saveStorage(storage);
    return { success: true };
}

function deleteMessage(userId, messageId) {
    const storage = loadStorage();
    const userStorage = storage[userId];
    if (!userStorage) return { success: false, error: 'User storage not found' };

    const index = userStorage.messages.findIndex(msg => msg.id === messageId);
    if (index === -1) return { success: false, error: 'Message not found' };

    userStorage.messages.splice(index, 1);
    saveStorage(storage);
    return { success: true };
}

function clearAllStorage(userId) {
    const storage = loadStorage();
    if (!storage[userId]) return { success: false, error: 'User storage not found' };
    delete storage[userId];
    saveStorage(storage);
    return { success: true };
}

function getStorageStats(userId) {
    const limits = getStorageLimits(userId);
    const userStorage = getUserStorage(userId);

    if (!userStorage) return { items: 0, messages: 0, nicknames: 0, limits };

    return {
        items: userStorage.items.length,
        messages: userStorage.messages.length,
        nicknames: Object.keys(userStorage.nicknames).length,
        limits
    };
}

module.exports = {
    getStorageLimits,
    initializeUserStorage,
    storeItem,
    storeMessage,
    storeNickname,
    getUserStorage,
    getUserItems,
    getUserMessages,
    deleteItem,
    deleteMessage,
    clearAllStorage,
    getStorageStats,
    STORAGE_LIMITS
};