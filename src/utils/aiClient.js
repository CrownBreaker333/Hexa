// AI CLIENT - INTELLIGENT 11-MODEL FALLBACK CHAIN
// Groq + OpenRouter with task-aware routing

import Groq from 'groq-sdk';
import OpenAI from 'openai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://hexa-bot.com',
    'X-Title': 'Hexa',
  },
});

// ─── Model registry ───────────────────────────────────────────────
const MODELS = {
  // Groq tiers (ultra-fast, free)
  groq_instant:   { client: groq,        id: 'meta-llama/llama-3.2-3b-instruct' },
  groq_fast:      { client: groq,        id: 'llama-3.1-8b-instant' },
  groq_reasoning: { client: groq,        id: 'llama-3.3-70b-versatile' },

  // OpenRouter fallback chain
  or_primary:     { client: openrouter,  id: 'openai/gpt-oss-120b:free' },
  or_reasoning:   { client: openrouter,  id: 'deepseek/deepseek-r1-0528:free' },

  // OpenRouter task-routed specialists
  or_coding:      { client: openrouter,  id: 'mistralai/devstral-2507:free' },
  or_coding_alt:  { client: openrouter,  id: 'qwen/qwen3-coder:free' },
  or_vision:      { client: openrouter,  id: 'google/gemma-3-27b-it:free' },
  or_longctx:     { client: openrouter,  id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free' },
  or_fast_plus:   { client: openrouter,  id: 'stepfun/step-3-5-flash:free' },
};

// ─── Task router ──────────────────────────────────────────────────
function routeModel(task, messageLength = 0) {
  if (task === 'coding')          return MODELS.or_coding;
  if (task === 'vision')          return MODELS.or_vision;
  if (task === 'reasoning')       return MODELS.or_reasoning;
  if (messageLength > 50000)      return MODELS.or_longctx;
  if (task === 'simple')          return MODELS.groq_instant;
  return MODELS.groq_fast; // default
}

// ─── Core chat function with fallback chain ────────────────────────
export async function chat(messages, { task = 'general', userId = null } = {}) {
  const msgLength = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  
  console.log(`[HEXA AI] Processing ${task} task (${msgLength} chars) for ${userId}`);

  // Task-based routing first (no fallback needed for specialists)
  if (['coding', 'vision', 'reasoning'].includes(task)) {
    const model = routeModel(task, msgLength);
    console.log(`[HEXA AI] Task routing to specialist: ${model.id}`);
    try {
      const result = await callModel(model, messages);
      console.log(`[HEXA AI] SUCCESS from specialist model`);
      return result;
    } catch (err) {
      console.warn(`[HEXA AI] Task model failed (${task}): ${err.message}`);
    }
  }

  // Main fallback chain
  const chain = [
    msgLength > 50000 ? MODELS.or_longctx : MODELS.groq_instant,
    MODELS.groq_fast,
    MODELS.groq_reasoning,
    MODELS.or_primary,
    MODELS.or_reasoning,
  ];

  for (const model of chain) {
    try {
      console.log(`[HEXA AI] Attempting: ${model.id}`);
      const result = await callModel(model, messages);
      console.log(`[HEXA AI] SUCCESS from ${model.id}`);
      return result;
    } catch (err) {
      console.warn(`[HEXA AI] Model ${model.id} failed: ${err.message}`);
      continue;
    }
  }

  throw new Error('[HEXA AI] All models in fallback chain failed.');
}

// ─── Shared model caller ──────────────────────────────────────────
async function callModel(model, messages) {
  const res = await model.client.chat.completions.create({
    model: model.id,
    messages,
    max_tokens: 1024,
  });
  return res.choices[0].message.content;
}

export { MODELS, routeModel };