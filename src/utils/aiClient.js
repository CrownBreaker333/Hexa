const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversations
const conversations = new Map();

async function askAI(userId, message, guildId) {
    try {
        // Get or create conversation history
        const conversationKey = `${guildId}_${userId}`;
        if (!conversations.has(conversationKey)) {
            conversations.set(conversationKey, []);
        }
        
        const history = conversations.get(conversationKey);
        history.push({ role: 'user', content: message });

        // Try Groq first
        try {
            const response = await groq.chat.completions.create({
                messages: history,
                model: 'mixtral-8x7b-32768',
                max_tokens: 1024,
            });
            
            const assistantMessage = response.choices[0].message.content;
            history.push({ role: 'assistant', content: assistantMessage });
            
            // Keep last 10 messages for context
            if (history.length > 20) {
                conversations.set(conversationKey, history.slice(-20));
            }
            
            return assistantMessage;
        } catch (groqError) {
            console.log('[AI] Groq failed, trying Gemini...');
        }

        // Try Gemini if Groq fails
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(message);
            const assistantMessage = result.response.text();
            history.push({ role: 'assistant', content: assistantMessage });
            
            if (history.length > 20) {
                conversations.set(conversationKey, history.slice(-20));
            }
            
            return assistantMessage;
        } catch (geminiError) {
            console.log('[AI] Gemini failed, trying OpenRouter...');
        }

        // Try OpenRouter as fallback
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'mistralai/mistral-7b-instruct',
                    messages: history,
                    max_tokens: 1024,
                }),
            });
            
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            history.push({ role: 'assistant', content: assistantMessage });
            
            if (history.length > 20) {
                conversations.set(conversationKey, history.slice(-20));
            }
            
            return assistantMessage;
        } catch (openRouterError) {
            console.error('[AI] All services failed:', { groqError, geminiError: geminiError?.message, openRouterError: openRouterError?.message });
            return 'Sorry, all AI services are unavailable right now. Please try again later.';
        }
    } catch (error) {
        console.error('[AI] Error in askAI:', error);
        return 'An error occurred while processing your request.';
    }
}

module.exports = { askAI };