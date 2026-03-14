// HELP COMMAND
// Shows only commands available to regular users
// Dev and owner-only commands are intentionally excluded

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Definitive list of user-facing commands with categories
// Update this list when new commands are added
const USER_COMMANDS = [
    // AI
    { name: 'chat',            description: 'Ask Hexa anything — she will respond with full context memory',   category: 'AI' },
    { name: 'imagine',         description: 'Generate an image from a prompt (Pro — Coming Soon)',              category: 'AI' },

    // Information
    { name: 'weather',         description: 'Get real-time weather for any city in the world',                 category: 'Information' },
    { name: 'weather',         description: 'Get real-time weather for any city in the world',                 category: 'Information' },
    { name: 'server',          description: 'View information about this server',                              category: 'Information' },
    { name: 'user',            description: 'View information about yourself',                                 category: 'Information' },
    { name: 'stats',           description: 'View server and bot statistics',                                  category: 'Information' },
    { name: 'ping',            description: 'Check if Hexa is online and see response latency',               category: 'Information' },
    { name: 'uptime',          description: 'See how long Hexa has been online',                              category: 'Information' },

    // Memory
    { name: 'viewmemory',      description: 'View your stored conversation history',                          category: 'Memory' },
    { name: 'deletememory',    description: 'Delete entries from your conversation history',                   category: 'Memory' },
    { name: 'personalhistory', description: 'Browse your private chat history with Hexa',                     category: 'Memory' },

    // Settings & Premium
    { name: 'settings',        description: 'Configure Hexa for this server (Admin only)',                    category: 'Settings' },
    { name: 'setupverify',     description: 'Configure server verification (Admin only)',                     category: 'Settings' },
    { name: 'schedule',        description: 'Set up scheduled reminders (Pro — Coming Soon)',                 category: 'Settings' },
    { name: 'premiuminfo',     description: 'See what is coming in Hexa Premium and Pro tiers',               category: 'Settings' },
    { name: 'premium',         description: 'View your current tier',                                         category: 'Settings' },

    // Support
    { name: 'donate',          description: 'Support Hexa\'s development',                                    category: 'Support' },
];

const CATEGORY_COLORS = {
    'AI':          0x9B59B6,
    'Information': 0x3498DB,
    'Memory':      0x1ABC9C,
    'Settings':    0xF39C12,
    'Support':     0xE74C3C,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all commands available to you'),

    async execute(interaction) {
        // Group commands by category
        const grouped = {};
        for (const cmd of USER_COMMANDS) {
            if (!grouped[cmd.category]) grouped[cmd.category] = [];
            grouped[cmd.category].push(cmd);
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Hexa — Command List')
            .setDescription(
                `Here are all ${USER_COMMANDS.length} commands available to you.\n` +
                `Use \`/premiuminfo\` to see what is coming in premium tiers.`
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: 'Hexa • Use any command by typing / in the chat' })
            .setTimestamp();

        for (const [category, commands] of Object.entries(grouped)) {
            const value = commands
                .map(cmd => `\`/${cmd.name}\` — ${cmd.description}`)
                .join('\n');

            embed.addFields({
                name: category,
                value,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};