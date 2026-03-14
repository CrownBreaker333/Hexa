// AI CLIENT
// Handles requests to Groq with multi-turn conversation context
// All users get session memory. PREMIUM/PRO get deeper persisted memory.

const { getUserPersona } = require('./personalities');
const { getConversationHistory, addMessage } = require('./conversation');
const { getCachedResponse, setCachedResponse } = require('./cache');
const { hasHarmfulContent, sanitizeResponse, flagContent } = require('./moderation');
const { trackQuery } = require('./analytics');
const { getUserTier } = require('./premium');
const Groq = require('groq-sdk');
require('dotenv').config();

// Lazy initialization — avoids crash at startup if GROQ_API_KEY is missing
let groqClient = null;
function getGroqClient() {
    if (!groqClient) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in your .env file.');
        }
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

const MODELS = {
    fast: 'llama-3.1-8b-instant',
    reasoning: 'llama-3.3-70b-versatile'
};

function detectTaskType(prompt) {
    const reasoningKeywords = [
        'code', 'explain', 'how', 'why', 'analyze', 'debug',
        'implement', 'create', 'write', 'function', 'class',
        'algorithm', 'logic', 'step by step'
    ];
    const lower = prompt.toLowerCase();
    for (const keyword of reasoningKeywords) {
        if (lower.includes(keyword)) return 'reasoning';
    }
    return 'fast';
}

// ─── Human-like system prompt ─────────────────────────────────────────────────
// Instructs the AI to respond like a real person, not a robotic assistant.
// Covers tone, language handling, formatting, and natural conversation style.

function buildSystemPrompt(persona) {
    const base = `You are Hexa — a sharp, warm, and genuinely helpful assistant living inside Discord.

Your personality:
- You speak like a real person, not a corporate chatbot. No stiff phrases like "Certainly!", "Of course!", "Absolutely!", or "Great question!". Just talk.
- You are confident but never arrogant. Honest but never harsh. Warm but never sycophantic.
- You have a subtle wit — light humour when the moment calls for it, but you read the room and stay serious when needed.
- You are curious. If something is interesting you say so. You have opinions and you share them naturally.
- You use contractions. You use short sentences when they land better. You vary your rhythm.
- You never pad your responses. If the answer is one sentence, it's one sentence. If it needs depth, go deep.
- You never say you are an AI unless directly asked. You do not remind people you are a bot.
- You remember what has been said in this conversation and reference it naturally when relevant.

Language:
- You respond in whatever language the user writes in. If they write in French, you reply in French. Spanish — Spanish. Always match their language without commenting on it.
- You handle slang, typos, and informal phrasing gracefully. You understand what people mean, not just what they literally wrote.

Formatting:
- For Discord, use markdown naturally: **bold** for emphasis, \`code blocks\` for code, bullet points only when listing genuinely separate things.
- Never use headers like "## Introduction" in casual conversation. That is a document, not a chat.
- Keep responses tight. Discord is a chat app — walls of text get ignored.`;

    const personaMap = {
        default: base,
        friendly: base + '\n\nYou lean warm and encouraging. You genuinely root for the person you are talking to.',
        professional: base + '\n\nYou are polished and precise. Formal enough for a workplace, but never cold.',
        funny: base + '\n\nYou are quick and playful. Dry wit, good timing, never trying too hard.',
        serious: base + '\n\nYou are focused and direct. No fluff, no filler. Every word earns its place.',
        casual: base + '\n\nYou are laid back. Talk like a friend, not a service.',
        tutor: base + '\n\nYou are a patient teacher. You break things down clearly, use examples generously, and check understanding.',
        creative: base + '\n\nYou think sideways. Unexpected angles, original ideas, genuine imagination.'
    };

    return personaMap[persona] || base;
}

// ─── Core AI function ─────────────────────────────────────────────────────────

async function askAI(userId, prompt, guildId = null) {
    const startTime = Date.now();

    // Moderation first — prohibited prompts never reach cache or AI
    if (hasHarmfulContent(prompt)) {
        flagContent(userId, prompt, 'high', guildId);
        return 'I cannot respond to that request. Please ask me something else.';
    }

    const sanitizedPrompt = prompt.replace(/\/[a-z]+\s/gi, '').trim();
    const tier = getUserTier(userId);
    const conversationHistory = getConversationHistory(userId, tier);

    // Check cache
    const cached = getCachedResponse(sanitizedPrompt);
    if (cached) {
        addMessage(userId, 'user', sanitizedPrompt, tier);
        addMessage(userId, 'assistant', cached, tier);
        return cached;
    }

    const persona = getUserPersona(userId);
    const systemPrompt = buildSystemPrompt(persona);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: sanitizedPrompt }
    ];

    const taskType = detectTaskType(sanitizedPrompt);
    const primaryModel = MODELS[taskType];
    const fallbackModel = taskType === 'reasoning' ? MODELS.fast : MODELS.reasoning;

    let response;
    try {
        response = await askGroq(messages, primaryModel);
    } catch (error) {
        console.error(`Primary model ${primaryModel} failed:`, error.message);
        try {
            // Fallback without streaming to keep it simple
            response = await askGroq(messages, fallbackModel);
        } catch (fallbackError) {
            console.error(`Fallback model ${fallbackModel} failed:`, fallbackError.message);
            return 'Sorry, I am having trouble responding right now. Please try again later.';
        }
    }

    response = response.trim();

    if (hasHarmfulContent(response)) {
        flagContent(userId, response, 'medium', guildId);
        response = sanitizeResponse(response);
    }

    addMessage(userId, 'user', sanitizedPrompt, tier);
    addMessage(userId, 'assistant', response, tier);
    setCachedResponse(sanitizedPrompt, response);

    const responseTime = Date.now() - startTime;
    trackQuery(userId, persona, responseTime);

    return response;
}

async function askGroq(messages, model) {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
        messages,
        model,
        max_tokens: 1000,
        temperature: 0.8
    });
    return response.choices[0].message.content;
}

module.exports = {
    askAI,
    askGroq,
    buildSystemPrompt
};