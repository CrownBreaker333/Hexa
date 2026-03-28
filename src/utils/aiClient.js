// AI CLIENT - 4-TIER REDUNDANCY WITH INTELLIGENT MODEL SELECTION
// Groq (fast) → Groq (reasoning) → Gemini → OpenRouter
// Detects task type and chooses optimal model

const { getUserPersona } = require('./personalities');
const { saveConversation, loadConversation } = require('./dataManager');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
require('dotenv').config();

// ─── CLIENT INITIALIZATION ───────────────────────────────────────────

let groqClient = null;
let geminiClient = null;
let openrouterClient = null;

function getGroqClient() {
    if (!groqClient) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set');
        }
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

function getGeminiClient() {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not set');
            return null;
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
}

function getOpenRouterClient() {
    if (!openrouterClient) {
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn('OPENROUTER_API_KEY not set');
            return null;
        }
        openrouterClient = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1'
        });
    }
    return openrouterClient;
}

// ─── INTELLIGENT MODEL SELECTION ───────────────────────────────────────────

const TASK_TYPES = {
    SIMPLE: 'simple',           // Quick answers, casual chat
    REASONING: 'reasoning',     // Code, analysis, step-by-step
    CREATIVE: 'creative',       // Writing, brainstorming, ideas
    TECHNICAL: 'technical',     // Complex technical questions
    CONVERSATION: 'conversation' // General chat, casual conversation
};

function detectTaskType(prompt) {
    const lower = prompt.toLowerCase();

    // TECHNICAL KEYWORDS
    const technicalKeywords = [
        'code', 'debug', 'algorithm', 'function', 'class', 'api', 'database',
        'sql', 'javascript', 'python', 'java', 'regex', 'npm', 'git',
        'html', 'css', 'react', 'node', 'express', 'mongodb', 'error',
        'implement', 'architecture', 'optimization', 'performance'
    ];

    // REASONING KEYWORDS
    const reasoningKeywords = [
        'explain', 'why', 'how', 'analyze', 'calculate', 'solve',
        'prove', 'compare', 'contrast', 'break down', 'step by step',
        'physics', 'math', 'chemistry', 'biology', 'economics',
        'logic', 'reasoning', 'complex', 'difficult'
    ];

    // CREATIVE KEYWORDS
    const creativeKeywords = [
        'write', 'story', 'poem', 'song', 'creative', 'idea', 'brainstorm',
        'imagine', 'describe', 'narrative', 'character', 'plot', 'fiction',
        'script', 'dialogue', 'metaphor', 'inspire'
    ];

    // SIMPLE KEYWORDS (quick answers)
    const simpleKeywords = [
        'what is', 'who is', 'when is', 'where is', 'definition',
        'meaning', 'hello', 'hi', 'hey', 'thanks', 'yes', 'no',
        'help', 'info', 'simple', 'quick'
    ];

    // Check for technical
    for (const keyword of technicalKeywords) {
        if (lower.includes(keyword)) return TASK_TYPES.TECHNICAL;
    }

    // Check for creative
    for (const keyword of creativeKeywords) {
        if (lower.includes(keyword)) return TASK_TYPES.CREATIVE;
    }

    // Check for reasoning
    for (const keyword of reasoningKeywords) {
        if (lower.includes(keyword)) return TASK_TYPES.REASONING;
    }

    // Check for simple
    for (const keyword of simpleKeywords) {
        if (lower.includes(keyword)) return TASK_TYPES.SIMPLE;
    }

    // Default to conversation
    return TASK_TYPES.CONVERSATION;
}

function selectModelForTask(taskType) {
    const modelMap = {
        [TASK_TYPES.SIMPLE]: { name: 'llama-3.1-8b-instant', description: 'Fast model for quick answers' },
        [TASK_TYPES.CONVERSATION]: { name: 'llama-3.1-8b-instant', description: 'Fast model for casual chat' },
        [TASK_TYPES.REASONING]: { name: 'llama-3.3-70b-versatile', description: 'Reasoning model for complex analysis' },
        [TASK_TYPES.TECHNICAL]: { name: 'llama-3.3-70b-versatile', description: 'Reasoning model for technical questions' },
        [TASK_TYPES.CREATIVE]: { name: 'llama-3.1-8b-instant', description: 'Fast model for creative tasks' }
    };

    return modelMap[taskType] || modelMap[TASK_TYPES.CONVERSATION];
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────

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
- You respond in whatever language the user writes in.
- You handle slang, typos, and informal phrasing gracefully.

Formatting:
- For Discord, use markdown naturally: **bold** for emphasis, \`code blocks\` for code.
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

// ─── AI PROVIDER FUNCTIONS ───────────────────────────────────────────

// PROVIDER 1: Groq (Fast + Reasoning)
async function askGroq(messages, model) {
    try {
        const client = getGroqClient();
        const response = await client.chat.completions.create({
            messages,
            model,
            max_tokens: 1000,
            temperature: 0.8
        });
        console.log(`[GROQ] Response using ${model}`);
        return response.choices[0].message.content;
    } catch (error) {
        console.error(`[GROQ] Error with ${model}:`, error.message);
        throw error;
    }
}

// PROVIDER 2: Gemini (Premium fallback)
async function askGemini(messages, systemPrompt) {
    try {
        const client = getGeminiClient();
        if (!client) {
            throw new Error('Gemini not configured');
        }

        const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const geminiMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        const response = await model.generateContent({
            contents: geminiMessages,
            systemInstruction: systemPrompt,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.8
            }
        });

        console.log('[GEMINI] Response successful');
        return response.response.text();
    } catch (error) {
        console.error('[GEMINI] Error:', error.message);
        throw error;
    }
}

// PROVIDER 3: OpenRouter (Multiple models available)
async function askOpenRouter(messages, model = 'openai/gpt-3.5-turbo') {
    try {
        const client = getOpenRouterClient();
        if (!client) {
            throw new Error('OpenRouter not configured');
        }

        const response = await client.chat.completions.create({
            model: model,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.8
        });

        console.log(`[OPENROUTER] Response using ${model}`);
        return response.choices[0].message.content;
    } catch (error) {
        console.error(`[OPENROUTER] Error with ${model}:`, error.message);
        throw error;
    }
}

// ─── MAIN AI FUNCTION ───────────────────────────────────────────

async function askAI(userId, prompt, guildId = null) {
    console.log(`\n[AI] Processing query from ${userId}`);
    console.log(`[AI] Prompt: "${prompt.substring(0, 50)}..."`);

    // Detect task type
    const taskType = detectTaskType(prompt);
    const modelInfo = selectModelForTask(taskType);

    console.log(`[AI] Detected task type: ${taskType}`);
    console.log(`[AI] Selected model: ${modelInfo.name} (${modelInfo.description})`);

    // Get user personality
    const persona = getUserPersona(userId, guildId);
    const systemPrompt = buildSystemPrompt(persona);

    // Load conversation history
    const conversationKey = `conversations:${userId}`;
    let history = [];
    try {
        const saved = require('./dataManager').loadJSON('conversations.json');
        history = saved[userId] || [];
    } catch (e) {
        history = [];
    }

    // Limit history to last 10 messages
    const limitedHistory = history.slice(-10);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...limitedHistory,
        { role: 'user', content: prompt }
    ];

    let response;
    let usedProvider = '';

    // ─── TIER 1: PRIMARY GROQ ───────────────────────────────────────────
    try {
        console.log(`[TIER 1] Attempting Groq (${modelInfo.name})...`);
        response = await askGroq(messages, modelInfo.name);
        usedProvider = `Groq (${modelInfo.name})`;
        console.log(`[SUCCESS] Response from Groq\n`);
    } catch (error1) {
        console.error(`[TIER 1] Groq failed: ${error1.message}`);

        // ─── TIER 2: SECONDARY GROQ (opposite model) ───────────────────────────────────────────
        const secondaryModel = modelInfo.name === 'llama-3.1-8b-instant' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';

        try {
            console.log(`[TIER 2] Attempting Groq fallback (${secondaryModel})...`);
            response = await askGroq(messages, secondaryModel);
            usedProvider = `Groq Fallback (${secondaryModel})`;
            console.log(`[SUCCESS] Response from Groq Fallback\n`);
        } catch (error2) {
            console.error(`[TIER 2] Groq fallback failed: ${error2.message}`);

            // ─── TIER 3: GEMINI ───────────────────────────────────────────
            try {
                console.log(`[TIER 3] Attempting Gemini...`);
                response = await askGemini(messages, systemPrompt);
                usedProvider = 'Gemini';
                console.log(`[SUCCESS] Response from Gemini\n`);
            } catch (error3) {
                console.error(`[TIER 3] Gemini failed: ${error3.message}`);

                // ─── TIER 4: OPENROUTER ───────────────────────────────────────────
                try {
                    console.log(`[TIER 4] Attempting OpenRouter (GPT-3.5)...`);
                    response = await askOpenRouter(messages, 'openai/gpt-3.5-turbo');
                    usedProvider = 'OpenRouter (GPT-3.5)';
                    console.log(`[SUCCESS] Response from OpenRouter\n`);
                } catch (error4) {
                    console.error(`[TIER 4] OpenRouter failed: ${error4.message}`);
                    console.error(`[CRITICAL] All AI providers failed!\n`);
                    return 'Sorry, I am having trouble responding right now. Please try again later.';
                }
            }
        }
    }

    // Save to conversation history
    try {
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'assistant', content: response });
        const conversationFile = require('./dataManager').loadJSON('conversations.json') || {};
        conversationFile[userId] = history;
        require('./dataManager').saveJSON('conversations.json', conversationFile);
    } catch (e) {
        console.error('[AI] Error saving conversation:', e.message);
    }

    console.log(`[AI] Response from: ${usedProvider}`);
    return response.trim();
}

module.exports = {
    askAI,
    detectTaskType,
    selectModelForTask,
    TASK_TYPES
};