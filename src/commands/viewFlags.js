const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadJSON } = require('../utils/dataManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('viewflags')
		.setDescription('Dev only - View moderation flags')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		if (interaction.user.id !== interaction.client.ownerId) {
			return interaction.reply({ content: 'This command is dev only.', flags: 64 });
		}

		const flags = loadJSON('data/flags.json', {});

		if (Object.keys(flags).length === 0) {
			return interaction.reply({
				content: 'No flags recorded yet. All systems clean.',
				flags: 64
			});
		}

		const entries = Object.entries(flags).sort((a, b) => b[1].count - a[1].count);
		const itemsPerPage = 5;
		const totalPages = Math.ceil(entries.length / itemsPerPage);

		let currentPage = 0;

		const buildEmbed = (page) => {
			const start = page * itemsPerPage;
			const end = start + itemsPerPage;
			const pageEntries = entries.slice(start, end);

			const embed = new EmbedBuilder()
				.setColor('#FF0000')
				.setTitle('Moderation Flags')
				.setDescription(`${entries.length} total users flagged`)
				.setFooter({ text: `Page ${page + 1}/${totalPages}` })
				.setTimestamp();

			pageEntries.forEach(([userId, flagData]) => {
				const firstFlagged = new Date(flagData.firstFlagged).toLocaleDateString();
				const lastFlagged = new Date(flagData.lastFlagged).toLocaleDateString();

				embed.addFields({
					name: `<@${userId}> (${flagData.count} flags)`,
					value: `First: ${firstFlagged}\nLast: ${lastFlagged}\nReasons: ${flagData.reasons.slice(0, 3).join(', ')}${flagData.reasons.length > 3 ? '...' : ''}`,
					inline: false
				});
			});

			return embed;
		};

		const buttons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('flags_prev')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new ButtonBuilder()
					.setCustomId('flags_next')
					.setLabel('Next')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(totalPages <= 1)
			);

		const message = await interaction.reply({
			embeds: [buildEmbed(currentPage)],
			components: totalPages > 1 ? [buttons] : [],
			flags: 64
		});

		if (totalPages <= 1) return;

		const collector = message.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: 300000
		});

		collector.on('collect', async i => {
			if (i.customId === 'flags_prev') {
				currentPage = Math.max(0, currentPage - 1);
			} else if (i.customId === 'flags_next') {
				currentPage = Math.min(totalPages - 1, currentPage + 1);
			}

			const updatedButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('flags_prev')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(currentPage === 0),
					new ButtonBuilder()
						.setCustomId('flags_next')
						.setLabel('Next')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(currentPage === totalPages - 1)
				);

			await i.update({
				embeds: [buildEmbed(currentPage)],
				components: [updatedButtons]
			});
		});

		collector.on('end', () => {
			const disabledButtons = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('flags_prev')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId('flags_next')
						.setLabel('Next')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true)
				);

			message.edit({ components: [disabledButtons] });
		});
	}
};