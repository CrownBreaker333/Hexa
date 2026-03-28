// Updated aiClient.js

function sendMessageToGroq(message) {
    // Remove timestamp from messages
    const cleanedMessage = message.replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, '');
    // Send the cleaned message
    // ... (sending logic for Groq)
}

function configureModels() {
    const model = 'gemini-1.5-flash'; // Changed to Gemini 1.5 Flash model
    const openRouterModel = 'free-model'; // Update OpenRouter to use a free model
    // ... (configuration logic)
}

// Other functions and logic
