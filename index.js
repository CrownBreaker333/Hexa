require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { watchCommands } = require('./utils/watcher');
const { getSchedulesDueNow } = require('./utils/scheduling');

// Global crash guards — prevent unhandled errors from killing the bot
process.on('unhandledRejection', (error) => {
 console.error('[UNHANDLED REJECTION]', error);
});
process.on('uncaughtException', (error) => {
 console.error('[UNCAUGHT EXCEPTION]', error);
});

const client = new Client({
 intents: [
 GatewayIntentBits.Guilds,
 GatewayIntentBits.GuildMembers,
 GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent
 ]
});

client.commands = new Collection();
client.startTime = Date.now();

// ─── Load Commands ─────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
 const filePath = path.join(commandsPath, file);
 const command = require(filePath);
 if ('data' in command && 'execute' in command) {
 client.commands.set(command.data.name, command);
 } else {
 console.warn(`[WARNING] ${filePath} is missing "data" or "execute" — skipped.`);
 }
}

// ─── Hot Reload Watcher (Commands Only) ────────────────────────────────────────
watchCommands(client);

// ─── Load Events (NO HOT RELOAD) ───────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
 const filePath = path.join(eventsPath, file);
 const event = require(filePath);
 
 if (event.once) {
 client.once(event.name, (...args) => event.execute(...args));
 } else {
 client.on(event.name, (...args) => event.execute(...args));
 }
}

// ─── Ready ─────────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async (readyClient) => {
 const { logSystem } = require('./utils/logger');
 logSystem(`Hexa is online and ready! Logged in as ${readyClient.user.tag}`);

 // Build commands array
 const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());

 try {
 if (process.env.NODE_ENV === 'development' && process.env.DEV_GUILD_ID) {
 // Dev: register to one guild instantly — avoids global rate limits during development
 const guild = readyClient.guilds.cache.get(process.env.DEV_GUILD_ID);
 if (guild) {
 await guild.commands.set(commands);
 logSystem(`Registered ${commands.length} commands to dev guild.`);
 } else {
 console.warn('[WARNING] DEV_GUILD_ID set but guild not found in cache.');
 }
 } else {
 // Production: register globally
 await readyClient.application.commands.set(commands);
 logSystem(`Registered ${commands.length} commands globally.`);
 }
 } catch (error) {
 console.error('[ERROR] Failed to register commands:', error);
 }

 // ─── Scheduling Runner ───────────────────────────────────────────────────
 setInterval(async () => {
 try {
 const due = getSchedulesDueNow();
 for (const schedule of due) {
 if (!schedule.channelId) continue;
 const channel = await readyClient.channels.fetch(schedule.channelId).catch(() => null);
 if (channel) {
 await channel.send(` **Reminder:** ${schedule.message}`).catch(e =>
 console.error(`[SCHEDULER] Failed to send reminder:`, e.message)
 );
 }
 }
 } catch (e) {
 console.error('[SCHEDULER] Error checking schedules:', e);
 }
 }, 60_000);
});

// ─── Login ─────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);