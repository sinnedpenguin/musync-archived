const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('View latency.'),
  async execute(interaction) {
    const pingingEmbed = new EmbedBuilder()
      .setDescription('Pinging...');

    const sent = await interaction.reply({ embeds: [pingingEmbed], fetchReply: true });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    let color;

    if (latency < 200) {
      color = '#00FF00';
    } else if (latency < 400) {
      color = '#FFFF00';
    } else if (latency < 500) {
      color = '#FFA500';
    } else {
      color = '#FF0000';
    }

    const updatedEmbed = new EmbedBuilder()
      .setDescription(`Roundtrip latency: **${latency}ms**`)
      .setColor(color);

    interaction.editReply({ embeds: [updatedEmbed] });
  },
};
