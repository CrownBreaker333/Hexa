// COMMAND WATCHER
// Hot-reloads command files in development without restarting the bot
// Debounced to avoid the 2-4 duplicate events fs.watch fires per save
// Skips deleted files instead of trying to re-require them

const fs = require('fs');
const path = require('path');

function watchCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const debounceTimers = {};

    fs.watch(commandsPath, (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;

        // Debounce — only act after 300ms of silence for this file
        clearTimeout(debounceTimers[filename]);
        debounceTimers[filename] = setTimeout(() => {
            const fullPath = path.join(commandsPath, filename);

            // File was deleted — remove from client commands
            if (!fs.existsSync(fullPath)) {
                // Find and remove by matching the file's command name
                for (const [name, cmd] of client.commands.entries()) {
                    if (cmd.__filename === fullPath) {
                        client.commands.delete(name);
                        console.log(`[WATCHER] Unloaded deleted command from file: ${filename}`);
                        break;
                    }
                }
                return;
            }

            // Clear require cache so changes are picked up
            delete require.cache[require.resolve(fullPath)];

            try {
                const command = require(fullPath);
                if ('data' in command && 'execute' in command) {
                    // Tag it so we can identify it by file path on deletion
                    command.__filename = fullPath;
                    client.commands.set(command.data.name, command);
                    console.log(`[WATCHER] Reloaded: /${command.data.name} (${filename})`);
                } else {
                    console.warn(`[WATCHER] Skipped ${filename} — missing data or execute`);
                }
            } catch (error) {
                console.error(`[WATCHER] Failed to reload ${filename}:`, error.message);
            }
        }, 300);
    });

    console.log('[WATCHER] Watching commands directory for changes');
}

module.exports = { watchCommands };