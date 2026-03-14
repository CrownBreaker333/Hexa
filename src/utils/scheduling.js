// SCHEDULED COMMANDS
// Manages scheduled reminders and daily briefings
// NOTE: The runner that calls getSchedulesDueNow() lives in index.js (setInterval every 60s)
// Schedules also require a channelId stored at creation time so the runner knows where to send

const { loadJSON, saveJSON } = require('./dataManager');

const SCHEDULE_FILE = 'schedules.json';

function loadSchedules() {
    return loadJSON(SCHEDULE_FILE);
}

function saveSchedules(data) {
    saveJSON(SCHEDULE_FILE, data);
}

// channelId is required so the index.js runner can deliver the message
function createSchedule(userId, guildId, channelId, type, time, message) {
    const schedules = loadSchedules();
    const scheduleId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (!schedules[guildId]) schedules[guildId] = {};

    schedules[guildId][scheduleId] = {
        userId,
        channelId,
        type,   // 'reminder' | 'dailyBriefing'
        time,   // 'HH:MM' 24-hour format
        message,
        active: true,
        createdAt: new Date().toISOString()
    };

    saveSchedules(schedules);
    return scheduleId;
}

function getSchedules(guildId) {
    const schedules = loadSchedules();
    return schedules[guildId] || {};
}

// Only removes schedules owned by the requesting user
function removeSchedule(guildId, scheduleId, userId) {
    const schedules = loadSchedules();
    if (!schedules[guildId] || !schedules[guildId][scheduleId]) return false;

    // Ownership check — users can only delete their own schedules
    if (schedules[guildId][scheduleId].userId !== userId) return false;

    delete schedules[guildId][scheduleId];
    saveSchedules(schedules);
    return true;
}

function updateSchedule(guildId, scheduleId, updates) {
    const schedules = loadSchedules();
    if (schedules[guildId]?.[scheduleId]) {
        schedules[guildId][scheduleId] = { ...schedules[guildId][scheduleId], ...updates };
        saveSchedules(schedules);
    }
}

// Returns all schedules whose HH:MM matches the current UTC time
// Called every minute from the setInterval in index.js
function getSchedulesDueNow() {
    const schedules = loadSchedules();
    const now = new Date();
    const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

    const due = [];
    for (const [guildId, guildSchedules] of Object.entries(schedules)) {
        for (const [scheduleId, schedule] of Object.entries(guildSchedules)) {
            if (schedule.active && schedule.time === currentTime) {
                due.push({ guildId, scheduleId, ...schedule });
            }
        }
    }
    return due;
}

module.exports = {
    createSchedule,
    getSchedules,
    removeSchedule,
    updateSchedule,
    getSchedulesDueNow
};