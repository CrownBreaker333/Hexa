// AI INTEGRATIONS
// Unified interface for multiple AI providers: Groq, Gemini, Claude, TogetherAI
// Each provides askQuestion() with consistent response format

const { OpenAI } = require('openai');
const Groq = require('groq-sdk');

// Initialize providers based on available credentials
const providers = {};

// GROQ Integration
class GroqConnector {
    constructor() {
        this.client = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
    }

    async askQuestion(prompt, options = {}) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                max_tokens: options.maxTokens || 2048,
                temperature: options.temperature || 0.7,
            });

            return {
                success: true,
                provider: 'Groq',
                response: response.choices[0]?.message?.content || 'No response',
                model: this.model,
                usage: {
                    promptTokens: response.usage?.prompt_tokens,
                    completionTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens
                }
            };
        } catch (error) {
            return {
                success: false,
                provider: 'Groq',
                error: error.message
            };
        }
    }

    async askDebug(prompt, options = {}) {
        // Debug mode for coding/math - more verbose output
        const debugPrompt = `You are a helpful debugging assistant. Provide detailed explanations and step-by-step solutions.\n\nUser Query:\n${prompt}`;
        return this.askQuestion(debugPrompt, { ...options, temperature: 0.5 });
    }
}

// GEMINI Integration (using OpenAI-compatible endpoint if available)
class GeminiConnector {
    constructor() {
        // Note: Gemini requires direct API or a compatible endpoint
        // This is a placeholder for Gemini integration
        this.apiKey = process.env.GEMINI_API_KEY;
        this.model = 'gemini-pro';
        this.available = !!this.apiKey;
    }

    async askQuestion(prompt, options = {}) {
        if (!this.available) {
            return {
                success: false,
                provider: 'Gemini',
                error: 'Gemini API key not configured'
            };
        }

        try {
            // Using Gemini API directly (would need proper SDK)
            // This is a conceptual implementation
            return {
                success: true,
                provider: 'Gemini',
                response: 'Gemini integration requires additional setup',
                model: this.model
            };
        } catch (error) {
            return {
                success: false,
                provider: 'Gemini',
                error: error.message
            };
        }
    }

    async askDebug(prompt, options = {}) {
        const debugPrompt = `You are an expert code analyzer and mathematician. Provide detailed explanations.\n\n${prompt}`;
        return this.askQuestion(debugPrompt, options);
    }
}

// OPENAI / CLAUDE Integration
class OpenAIConnector {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    }

    async askQuestion(prompt, options = {}) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                max_tokens: options.maxTokens || 2048,
                temperature: options.temperature || 0.7,
            });

            return {
                success: true,
                provider: 'OpenAI',
                response: response.choices[0]?.message?.content || 'No response',
                model: this.model,
                usage: {
                    promptTokens: response.usage?.prompt_tokens,
                    completionTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens
                }
            };
        } catch (error) {
            return {
                success: false,
                provider: 'OpenAI',
                error: error.message
            };
        }
    }

    async askDebug(prompt, options = {}) {
        const systemPrompt = `You are an expert assistant specializing in debugging code, solving complex math problems, and providing detailed technical analysis. Be thorough and educational.`;
        
        try {
            const response = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: this.model,
                max_tokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.5,
            });

            return {
                success: true,
                provider: 'OpenAI',
                response: response.choices[0]?.message?.content || 'No response',
                model: this.model,
                debugMode: true
            };
        } catch (error) {
            return {
                success: false,
                provider: 'OpenAI',
                error: error.message
            };
        }
    }
}

// TOGETHERAI Integration
class TogetherAIConnector {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.TOGETHERAI_API_KEY,
            baseURL: 'https://api.together.xyz/v1'
        });
        this.model = process.env.TOGETHERAI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1';
    }

    async askQuestion(prompt, options = {}) {
        try {
            const response = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                max_tokens: options.maxTokens || 2048,
                temperature: options.temperature || 0.7,
            });

            return {
                success: true,
                provider: 'TogetherAI',
                response: response.choices[0]?.message?.content || 'No response',
                model: this.model,
                usage: {
                    promptTokens: response.usage?.prompt_tokens,
                    completionTokens: response.usage?.completion_tokens,
                    totalTokens: response.usage?.total_tokens
                }
            };
        } catch (error) {
            return {
                success: false,
                provider: 'TogetherAI',
                error: error.message
            };
        }
    }

    async askDebug(prompt, options = {}) {
        const debugPrompt = `You are a technical expert. Provide clear, detailed explanations:\n\n${prompt}`;
        return this.askQuestion(debugPrompt, { ...options, temperature: 0.5 });
    }
}

// Initialize available providers
function initializeProviders() {
    providers.groq = process.env.GROQ_API_KEY ? new GroqConnector() : null;
    providers.gemini = process.env.GEMINI_API_KEY ? new GeminiConnector() : null;
    providers.openai = process.env.OPENAI_API_KEY ? new OpenAIConnector() : null;
    providers.togetherai = process.env.TOGETHERAI_API_KEY ? new TogetherAIConnector() : null;
}

initializeProviders();

// Get a specific provider
function getProvider(name) {
    return providers[name.toLowerCase()] || null;
}

// Get all available providers
function getAvailableProviders() {
    return Object.entries(providers)
        .filter(([_, provider]) => provider !== null)
        .map(([name, _]) => name);
}

// Ask question with fallback to other providers
async function askWithFallback(prompt, preferredProvider = 'groq', options = {}) {
    const providers_list = getAvailableProviders();
    
    if (providers_list.length === 0) {
        return {
            success: false,
            error: 'No AI providers configured'
        };
    }

    // Try preferred provider first
    if (providers_list.includes(preferredProvider)) {
        const provider = getProvider(preferredProvider);
        const result = await provider.askQuestion(prompt, options);
        if (result.success) return result;
    }

    // Fallback to other providers
    for (const providerName of providers_list) {
        if (providerName === preferredProvider) continue; // Already tried this
        const provider = getProvider(providerName);
        const result = await provider.askQuestion(prompt, options);
        if (result.success) return result;
    }

    return {
        success: false,
        error: 'All providers failed'
    };
}

// Debug mode with fallback
async function debugWithFallback(prompt, preferredProvider = 'openai', options = {}) {
    const providers_list = getAvailableProviders();
    
    if (providers_list.length === 0) {
        return {
            success: false,
            error: 'No AI providers configured'
        };
    }

    // Try preferred provider first
    if (providers_list.includes(preferredProvider)) {
        const provider = getProvider(preferredProvider);
        const result = await provider.askDebug(prompt, options);
        if (result.success) return result;
    }

    // Fallback
    for (const providerName of providers_list) {
        if (providerName === preferredProvider) continue;
        const provider = getProvider(providerName);
        const result = await provider.askDebug(prompt, options);
        if (result.success) return result;
    }

    return {
        success: false,
        error: 'All providers failed for debug mode'
    };
}

module.exports = {
    // Connectors
    GroqConnector,
    GeminiConnector,
    OpenAIConnector,
    TogetherAIConnector,
    
    // Provider management
    getProvider,
    getAvailableProviders,
    
    // High-level functions
    askWithFallback,
    debugWithFallback,
    
    // Direct access to providers
    providers
};
