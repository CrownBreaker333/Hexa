// DATA MANAGER
// Utility functions for data persistence and initialization
// Centralizes directory creation and file operations

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return DATA_DIR;
}

function getDataPath(filename) {
    ensureDataDir();
    return path.join(DATA_DIR, filename);
}

function loadJSON(filename) {
    const filePath = getDataPath(filename);
    
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return {};
    }
}

function saveJSON(filename, data) {
    const filePath = getDataPath(filename);
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
}

module.exports = {
    ensureDataDir,
    getDataPath,
    loadJSON,
    saveJSON,
    DATA_DIR
};
