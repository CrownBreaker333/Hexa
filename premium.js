// PREMIUM TIER SYSTEM
// Manages subscription tiers and feature gating
// upgradeUser/upgradeGuild are intentionally NOT exported as slash commands
// — they must only be called server-side after payment is confirmed

const { loadJSON, saveJSON } = require('./dataManager');

const PREMIUM_FILE = 'premium.json';

const TIERS = {
    FREE: {
        name: 'Free',
        price: '$0',
        features: {
            basic_chat: true,
            response_caching: true,
            personality_customize: true,
            ratings: true,
            daily_limit: 10
        }
    },
    PREMIUM: {
        name: 'Premium',
        price: '$4.99/month',
        features: {
            basic_chat: true,
            response_caching: true,
            personality_customize: true,
            ratings: true,
            conversation_memory: true,
            ai_fallbacks: true,
            moderation: true,
            daily_limit: 100,
            priority_support: true
        }
    },
    PRO: {
        name: 'Pro',
        price: '$9.99/month',
        features: {
            basic_chat: true,
            response_caching: true,
            personality_customize: true,
            ratings: true,
            conversation_memory: true,
            ai_fallbacks: true,
            moderation: true,
            image_generation: true,
            streaming_responses: true,
            scheduled_commands: true,
            analytics: true,
            guild_settings_advanced: true,
            daily_limit: 1000,
            priority_support: true,
            custom_personalities: true
        }
    }
};

// ─── Internal ─────────────────────────────────────────────────────────────────

function load() {
    return loadJSON(PREMIUM_FILE);
}

function save(data) {
    saveJSON(PREMIUM_FILE, data);
}

// ─── Tier lookup ──────────────────────────────────────────────────────────────

function getUserTier(userId) {
    const data = load();
    const record = data[userId];
    if (!record) return 'FREE';

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        delete data[userId];
        save(data);
        return 'FREE';
    }

    return record.tier || 'FREE';
}

function getGuildTier(guildId) {
    const data = load();
    const key = `guild_${guildId}`;
    const record = data[key];
    if (!record) return 'FREE';

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        delete data[key];
        save(data);
        return 'FREE';
    }

    return record.tier || 'FREE';
}

// ─── Upgrades — called only after payment verified externally ─────────────────

function upgradeUser(userId, tier, durationDays = 30) {
    if (!TIERS[tier]) throw new Error(`Invalid tier: ${tier}`);
    const data = load();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    data[userId] = {
        tier,
        purchasedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    };

    save(data);
    return data[userId];
}

function upgradeGuild(guildId, tier, durationDays = 30) {
    if (!TIERS[tier]) throw new Error(`Invalid tier: ${tier}`);
    const data = load();
    const key = `guild_${guildId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    data[key] = {
        tier,
        purchasedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    };

    save(data);
    return data[key];
}

// ─── Feature checks ───────────────────────────────────────────────────────────

// Guild-admin features (analytics, settings, moderation) check GUILD tier
// Personal features (memory, image gen) check USER tier
// This replaces the old blanket hasFeature() which checked user tier for everything
const GUILD_FEATURES = new Set([
    'analytics',
    'guild_settings_advanced',
    'moderation'
]);

function hasFeature(userId, guildId, feature) {
    if (GUILD_FEATURES.has(feature)) {
        return !!(TIERS[getGuildTier(guildId)]?.features[feature]);
    }
    const userTier = getUserTier(userId);
    if (TIERS[userTier]?.features[feature]) return true;
    // Guild tier can unlock features for all members (e.g. guild buys PRO)
    return !!(TIERS[getGuildTier(guildId)]?.features[feature]);
}

function getDailyLimit(userId, guildId) {
    return Math.max(
        TIERS[getUserTier(userId)]?.features.daily_limit || 0,
        TIERS[getGuildTier(guildId)]?.features.daily_limit || 0
    );
}

module.exports = {
    TIERS,
    getUserTier,
    getGuildTier,
    upgradeUser,
    upgradeGuild,
    hasFeature,
    getDailyLimit
};