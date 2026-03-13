const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('system')
		.setDescription('Dev only - Runtime statistics')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		if (interaction.user.id !== interaction.client.ownerId) {
			return interaction.reply({ content: 'This command is dev only.', flags: 64 });
		}

		const client = interaction.client;
		const uptime = client.uptime;

		const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
		const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

		const memUsage = process.memoryUsage();
		const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
		const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);

		const embed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle('System Statistics')
			.setDescription('Real-time bot runtime information')
			.addFields(
				{ name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
				{ name: 'Latency', value: `${client.ws.ping}ms`, inline: true },
				{ name: 'Heap Usage', value: `${heapUsed}MB / ${heapTotal}MB`, inline: true },
				{ name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
				{ name: 'Users Cached', value: client.users.cache.size.toString(), inline: true },
				{ name: 'Channels Cached', value: client.channels.cache.size.toString(), inline: true },
				{ name: 'Node Version', value: process.version, inline: true },
				{ name: 'Discord.js Version', value: require('discord.js').version, inline: true },
				{ name: 'Shard Count', value: (client.shard?.count ?? 1).toString(), inline: true }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed], flags: 64 });
	}
};