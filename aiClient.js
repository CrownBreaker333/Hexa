// aiClient.js

// Function to send messages to Groq API
async function sendMessage(messages) {
    // Remove timestamp property from each message
    messages = messages.map(msg => {
        const { timestamp, ...rest } = msg; // Destructure to remove timestamp
        return rest;
    });

    // Send messages to Groq API
    const response = await fetch('https://api.groq.com/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
    });

    return await response.json();
}

// Example of an OpenRouter call
const OpenRouter = {
    model: 'gpt-oss-120b', // Changed from openai/gpt-3.5-turbo
    send: sendMessage, 
};

// Update Gemini model
const Gemini = {
    model: 'gemini-2.5-flash', // Changed from gemini-2.0-flash
};
