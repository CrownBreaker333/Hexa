// PREMIUM MANAGER
// Centralized management for premium user features and access control
// Extends the existing premium.js with additional helper functions

const { TIERS, getUserTier, getGuildTier, hasFeature } = require('./premium');

// Check if user has premium (any tier above FREE)
function isPremium(userId) {
    const tier = getUserTier(userId);
    return tier !== 'FREE';
}

// Check if guild has premium
function isGuildPremium(guildId) {
    const tier = getGuildTier(guildId);
    return tier !== 'FREE';
}

// Check if user OR guild has premium (for features that can be guild-wide)
function hasPremiumAccess(userId, guildId) {
    return isPremium(userId) || isGuildPremium(guildId);
}

// Get all premium features for a user
function getUserFeatures(userId, guildId) {
    const tier = getUserTier(userId);
    const tierData = TIERS[tier];
    return tierData ? tierData.features : TIERS.FREE.features;
}

// Get all premium features for a guild
function getGuildFeatures(guildId) {
    const tier = getGuildTier(guildId);
    const tierData = TIERS[tier];
    return tierData ? tierData.features : TIERS.FREE.features;
}

// Get tier information
function getTierInfo(tier) {
    return TIERS[tier] || TIERS.FREE;
}

// Get all available tiers
function getAllTiers() {
    return Object.entries(TIERS).map(([key, value]) => ({
        key,
        ...value
    }));
}

// Check specific feature access with detailed response
function checkFeatureAccess(userId, guildId, feature) {
    const hasAccess = hasFeature(userId, guildId, feature);
    const userTier = getUserTier(userId);
    const guildTier = getGuildTier(guildId);
    
    return {
        hasAccess,
        userTier,
        guildTier,
        feature,
        requirementMessage: !hasAccess ? `This feature requires Premium or Pro tier. You are currently on ${userTier}.` : null
    };
}

// Get tier comparison for upgrade prompts
function getTierComparison() {
    return {
        FREE: TIERS.FREE.features.daily_limit,
        PREMIUM: TIERS.PREMIUM.features.daily_limit,
        PRO: TIERS.PRO.features.daily_limit
    };
}

// Format tier information for display
function formatTierDisplay(tier) {
    const tierData = TIERS[tier];
    if (!tierData) return 'Unknown tier';
    
    let display = `**${tierData.name}** - ${tierData.price}\n`;
    display += `Daily Limit: ${tierData.features.daily_limit} commands\n`;
    
    const features = [];
    if (tierData.features.conversation_memory) features.push('💬 Conversation Memory');
    if (tierData.features.image_generation) features.push('[Image Generation]');
    if (tierData.features.moderation) features.push('[Moderation Tools]');
    if (tierData.features.scheduled_commands) features.push('[Scheduled Commands]');
    if (tierData.features.custom_personalities) features.push('[Custom Personalities]');
    if (tierData.features.priority_support) features.push('[Priority Support]');
    
    if (features.length > 0) {
        display += `\n**Features:**\n${features.join('\n')}`;
    }
    
    return display;
}

// Build upgrade recommendation
function getUpgradeRecommendation(userId, guildId, neededFeature) {
    const userTier = getUserTier(userId);
    const tiers = getAllTiers();
    
    const tierWithFeature = tiers.find(t => t[neededFeature]);
    
    if (!tierWithFeature) {
        return `The feature you're looking for is not available.`;
    }
    
    return `To access **${neededFeature}**, you need to upgrade from **${userTier}** to **${tierWithFeature.key}** or higher.`;
}

module.exports = {
    isPremium,
    isGuildPremium,
    hasPremiumAccess,
    getUserFeatures,
    getGuildFeatures,
    getTierInfo,
    getAllTiers,
    checkFeatureAccess,
    getTierComparison,
    formatTierDisplay,
    getUpgradeRecommendation,
    // Re-export from premium.js for convenience
    getUserTier,
    getGuildTier,
    hasFeature,
    TIERS
};
