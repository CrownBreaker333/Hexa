// FLAG SYSTEM
// Tracks misbehaving users with flagging for repeated offenses
// Uses dataManager for consistent file handling

const { loadJSON, saveJSON } = require('./dataManager');

const FLAG_FILE = 'flags.json';

// Phrase-based prohibited detection to reduce false positives
const PROHIBITED_PHRASES = [
    'how to hack',
    'how to ddos',
    'how to bypass',
    'how to exploit',
    'how to make malware',
    'how to make a bomb',
];

const SEVERITY_LEVELS = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
};

const BAN_THRESHOLD = 5; // kick at 5, ban at 10

// ─── Internal helpers ──────────────────────────────────────────────────────────

function loadFlags() {
    return loadJSON(FLAG_FILE);
}

function saveFlags(data) {
    return saveJSON(FLAG_FILE, data);
}

// ─── Detection ────────────────────────────────────────────────────────────────

function containsProhibited(text) {
    const lower = text.toLowerCase();
    for (const phrase of PROHIBITED_PHRASES) {
        if (lower.includes(phrase)) return phrase;
    }
    return null;
}

function flagProhibited(userId, guildId, text) {
    const phrase = containsProhibited(text);
    if (phrase) {
        return flagUser(userId, guildId, `Prohibited phrase detected: "${phrase}"`, 'HIGH');
    }
    return null;
}

// ─── Core flag operations ─────────────────────────────────────────────────────

function flagUser(userId, guildId, reason, severity = 'MEDIUM') {
    const flags = loadFlags();
    const flagKey = `${guildId}_${userId}`;

    if (!flags[flagKey]) {
        flags[flagKey] = {
            userId,
            guildId,
            flagCount: 0,
            flags: [],
            totalSeverity: 0,
            createdAt: new Date().toISOString()
        };
    }

    const severityValue = SEVERITY_LEVELS[severity] || SEVERITY_LEVELS.MEDIUM;

    flags[flagKey].flags.push({
        reason,
        severity,
        severityValue,
        timestamp: new Date().toISOString()
    });

    flags[flagKey].flagCount += 1;
    flags[flagKey].totalSeverity += severityValue;
    flags[flagKey].lastFlaggedAt = new Date().toISOString();

    saveFlags(flags);

    return {
        flagCount: flags[flagKey].flagCount,
        totalSeverity: flags[flagKey].totalSeverity,
        shouldKick: flags[flagKey].flagCount >= BAN_THRESHOLD && flags[flagKey].flagCount < BAN_THRESHOLD * 2,
        shouldBan: flags[flagKey].flagCount >= BAN_THRESHOLD * 2
    };
}

function getFlags(userId, guildId) {
    const flags = loadFlags();
    return flags[`${guildId}_${userId}`] || null;
}

function getAllGuildFlags(guildId) {
    const flags = loadFlags();
    return Object.values(flags).filter(f => f.guildId === guildId);
}

function getAllFlags() {
    return loadFlags();
}

function removeFlagUser(userId, guildId) {
    const flags = loadFlags();
    delete flags[`${guildId}_${userId}`];
    saveFlags(flags);
}

function clearFlags(userId, guildId) {
    const flags = loadFlags();
    const flagKey = `${guildId}_${userId}`;
    if (flags[flagKey]) {
        flags[flagKey].flags = [];
        flags[flagKey].flagCount = 0;
        flags[flagKey].totalSeverity = 0;
        flags[flagKey].clearedAt = new Date().toISOString();
        saveFlags(flags);
    }
}

function formatFlagReport(userId, guildId, devView = false) {
    const userFlags = getFlags(userId, guildId);

    if (!userFlags) {
        return `No flags found for <@${userId}> in this guild.`;
    }

    let report = `Flag Report for <@${userId}>\n`;
    report += `Guild: ${userFlags.guildId}\n`;
    report += `Total Flags: ${userFlags.flagCount}\n`;
    report += `Severity Score: ${userFlags.totalSeverity}\n`;
    report += `Created At: ${new Date(userFlags.createdAt).toLocaleString()}\n`;

    if (devView) {
        report += `\nDetailed Flags:\n`;
        userFlags.flags.forEach((flag, index) => {
            report += `${index + 1}. [${flag.severity}] ${flag.reason} - ${new Date(flag.timestamp).toLocaleString()}\n`;
        });

        report += `\nRecommended Action:\n`;
        if (userFlags.flagCount >= BAN_THRESHOLD * 2) {
            report += `User should be BANNED (${userFlags.flagCount} flags)\n`;
        } else if (userFlags.flagCount >= BAN_THRESHOLD) {
            report += `User should be KICKED (${userFlags.flagCount} flags)\n`;
        } else {
            report += `Monitor user (${userFlags.flagCount} flags)\n`;
        }
    } else {
        report += `\n*Detailed information is only visible to the developer.*`;
    }

    return report;
}

module.exports = {
    flagUser,
    getFlags,
    getAllFlags,
    getAllGuildFlags,
    removeFlagUser,
    clearFlags,
    formatFlagReport,
    SEVERITY_LEVELS,
    BAN_THRESHOLD,
    PROHIBITED_PHRASES,
    containsProhibited,
    flagProhibited
};