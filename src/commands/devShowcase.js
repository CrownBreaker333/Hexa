const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('devshowcase')
		.setDescription('Dev only - System overview and command list')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		if (interaction.user.id !== process.env.DEV_ID) {
			return interaction.reply({ content: 'This command is dev only.', flags: 64 });
		}

		const client = interaction.client;
		const uptimeMs = client.uptime;
		const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
		const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

		const commandsFolder = path.join(__dirname);
		const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

		const pages = [
			// Page 1 - System Stats
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('System Overview')
				.setDescription('Real-time bot and server statistics')
				.addFields(
					{ name: 'Uptime', value: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`, inline: true },
					{ name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
					{ name: 'Latency', value: `${client.ws.ping}ms`, inline: true },
					{ name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
					{ name: 'Users', value: client.users.cache.size.toString(), inline: true },
					{ name: 'Node Version', value: process.version, inline: true }
				)
				.setFooter({ text: 'Page 1/7' })
				.setTimestamp(),

			// Page 2 - User Commands
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('User Commands (PUBLIC)')
				.setDescription('Available to all members')
				.addFields(
					{ name: '/chat', value: 'AI conversation with memory', inline: false },
					{ name: '/weather', value: 'Real-time weather lookup', inline: false },
					{ name: '/donate', value: 'Support page', inline: false },
					{ name: '/premiuminfo', value: 'Premium tier info', inline: false },
					{ name: '/premium', value: 'Current tier display', inline: false },
					{ name: '/ping', value: 'Bot latency', inline: false },
					{ name: '/stats', value: 'Server statistics', inline: false },
					{ name: '/server', value: 'Server information', inline: false },
					{ name: '/user', value: 'User information', inline: false },
					{ name: '/uptime', value: 'Bot uptime', inline: false }
				)
				.setFooter({ text: 'Page 2/7' })
				.setTimestamp(),

			// Page 3 - Memory & Settings Commands
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('Memory, Settings & Premium (PUBLIC/COMING SOON)')
				.setDescription('User history and configuration')
				.addFields(
					{ name: '/viewmemory', value: 'View chat history', inline: false },
					{ name: '/deletememory', value: 'Delete history entries', inline: false },
					{ name: '/personalhistory', value: 'Paginated chat log', inline: false },
					{ name: '/schedule', value: 'Coming Soon - Reminders', inline: false },
					{ name: '/settings', value: 'Guild configuration', inline: false },
					{ name: '/setupverify', value: 'Configure verification', inline: false },
					{ name: '/imagine', value: 'Coming Soon - Image gen', inline: false },
					{ name: '/help', value: 'All available commands', inline: false }
				)
				.setFooter({ text: 'Page 3/7' })
				.setTimestamp(),

			// Page 4 - Dev & Admin Commands
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('Dev & Admin Commands')
				.setDescription('Restricted access only')
				.addFields(
					{ name: '/devshowcase', value: 'DEV - This system overview', inline: false },
					{ name: '/system', value: 'DEV - Runtime statistics', inline: false },
					{ name: '/viewflags', value: 'DEV - Moderation flags', inline: false }
				)
				.setFooter({ text: 'Page 4/7' })
				.setTimestamp(),

			// Page 5 - Active AI Providers
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('Active AI Providers')
				.setDescription('Models and fallback chains')
				.addFields(
					{ name: 'Primary', value: 'Groq (llama-3.1-8b-instant)', inline: false },
					{ name: 'Status', value: 'Connected and responding', inline: false },
					{ name: 'Response Time', value: '< 1 second typical', inline: false },
					{ name: 'Fallback Support', value: 'Ready for Gemini, Together AI', inline: false }
				)
				.setFooter({ text: 'Page 5/7' })
				.setTimestamp(),

			// Page 6 - Premium Tier Config
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('Premium Tier Configuration')
				.setDescription('Feature limits and tiers')
				.addFields(
					{ name: 'FREE', value: 'Session memory (6 msgs), basic chat', inline: false },
					{ name: 'PREMIUM', value: 'Persistent memory (20 msgs), faster response', inline: false },
					{ name: 'PRO', value: 'Deep memory (40 msgs), all features', inline: false },
					{ name: 'Payment', value: 'Coming Soon - Not live yet', inline: false }
				)
				.setFooter({ text: 'Page 6/7' })
				.setTimestamp(),

			// Page 7 - Moderation & Storage
			new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle('Moderation & Storage Limits')
				.setDescription('Safety thresholds and quotas')
				.addFields(
					{ name: 'Content Filter', value: 'Phrase-based detection active', inline: false },
					{ name: 'Flagging', value: 'Violations logged and visible', inline: false },
					{ name: 'Memory Cap', value: 'Per-user limits by tier', inline: false },
					{ name: 'Storage', value: 'JSON files + 30s in-memory cache', inline: false }
				)
				.setFooter({ text: 'Page 7/7' })
				.setTimestamp()
		];

		let currentPage = 0;

		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('prev_page')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('next_page')
					.setLabel('Next')
					.setStyle(ButtonStyle.Secondary)
			);

		const message = await interaction.reply({
			embeds: [pages[currentPage]],
			components: [buttons],
			flags: 64
		});

		const collector = message.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: 600000
		});

		collector.on('collect', async i => {
			if (i.customId === 'prev_page') {
				currentPage = Math.max(0, currentPage - 1);
			} else if (i.customId === 'next_page') {
				currentPage = Math.min(pages.length - 1, currentPage + 1);
			}

			const updatedButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('prev_page')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(currentPage === 0),
					new ButtonBuilder()
						.setCustomId('next_page')
						.setLabel('Next')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(currentPage === pages.length - 1)
				);

			await i.update({
				embeds: [pages[currentPage]],
				components: [updatedButtons]
			});
		});

		collector.on('end', () => {
			const disabledButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('prev_page')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId('next_page')
						.setLabel('Next')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true)
				);

			message.edit({ components: [disabledButtons] });
		});
	}
};