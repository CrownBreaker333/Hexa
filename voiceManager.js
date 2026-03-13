// VOICE MANAGER
// Placeholder for future speech-to-text and text-to-speech features
// Google Cloud SDK imports and implementation will be added here
// when voice support is built out

async function speechToText(audioBuffer) {
    throw new Error('Voice features are not yet available. Coming soon.');
}

async function synthesizeSpeech(text, voice = 'en-US-Wavenet-D') {
    throw new Error('Voice features are not yet available. Coming soon.');
}

module.exports = {
    speechToText,
    synthesizeSpeech
};