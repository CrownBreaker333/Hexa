// MODERATION PIPELINE
// Filters harmful content before and after AI responses
// Connected to flagSystem so violations are actually persisted

const { flagUser } = require('./flagSystem');

// Phrase-based matching to avoid false positives on innocent words
// e.g. 'violence' alone would block history discussions, news, game reviews
const PROHIBITED_PHRASES = [
    'how to hack',
    'how to ddos',
    'how to bypass',
    'how to exploit',
    'how to make malware',
    'how to make a virus',
    'how to make a bomb',
    'how to make drugs',
    'how to make meth',
    'how to launder',
    'child porn',
    'cp links',
];

const BANNED_PATTERNS = [
    /kill\s+yourself/gi,
    /kys\b/gi,
    /self[\s-]harm/gi,
    /how\s+to\s+(commit\s+)?suicide/gi,
];

function hasHarmfulContent(text) {
    const lower = text.toLowerCase();

    for (const phrase of PROHIBITED_PHRASES) {
        if (lower.includes(phrase)) return true;
    }

    for (const pattern of BANNED_PATTERNS) {
        // Reset lastIndex for global regexes to avoid stale state across calls
        pattern.lastIndex = 0;
        if (pattern.test(text)) return true;
    }

    return false;
}

function sanitizeResponse(text) {
    let sanitized = text;

    for (const phrase of PROHIBITED_PHRASES) {
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        sanitized = sanitized.replace(regex, '[REDACTED]');
    }

    for (const pattern of BANNED_PATTERNS) {
        pattern.lastIndex = 0;
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
}

// Now actually persists to flagSystem instead of only console.warn
function flagContent(userId, content, severity = 'medium', guildId = null) {
    console.warn(`[MODERATION] User ${userId} - ${severity}: ${content.substring(0, 80)}`);

    if (userId && guildId) {
        try {
            flagUser(
                userId,
                guildId,
                `AI content filter triggered (${severity}): ${content.substring(0, 80)}`,
                severity.toUpperCase()
            );
        } catch (e) {
            console.error('[MODERATION] Failed to persist flag:', e.message);
        }
    }
}

module.exports = {
    hasHarmfulContent,
    sanitizeResponse,
    flagContent,
    PROHIBITED_PHRASES,
    BANNED_PATTERNS
};