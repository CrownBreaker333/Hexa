// DATA MANAGER
// Handles JSON file storage for conversations, preferences, data

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJSON(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return {};
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        return {};
    }
}

function saveJSON(filename, data) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error saving ${filename}:`, error.message);
    }
}

function appendJSON(filename, key, value) {
    try {
        const data = loadJSON(filename);
        data[key] = value;
        saveJSON(filename, data);
    } catch (error) {
        console.error(`Error appending to ${filename}:`, error.message);
    }
}

module.exports = {
    loadJSON,
    saveJSON,
    appendJSON
};