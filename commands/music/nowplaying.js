const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const filterManager = require('../../lib/filterManager');
const formatDuration = require('format-duration');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Display the currently playing song.'),
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guild.id);
    const currentTrack = player.queue.current;
    const currentTrackTitle = currentTrack.title || "N/A";

    if (!player || !player.queue.current) {
      return interaction.reply({ content: ':x: | There is no song currently playing!', ephemeral: true });
    }

    const repeatMode = player.trackRepeat ? 'ON' : 'OFF';
    const bassBoostStatus = filterManager.getBassBoostStatus();

    const filtersField = [];
  
    if (bassBoostStatus) {
      filtersField.push('Bass Boost');
    }
  
    if (player.filters.rotating) {
      filtersField.push('8D');
    }

    if (player.filters.karaoke) {
      filtersField.push('Karaoke');
    }

    if (player.filters.nightcore) {
      filtersField.push('Nightcore');
    }

    if (player.filters.lowpass) {
      filtersField.push('Soft');
    }

    if (player.filters.tremolo) {
      filtersField.push('Tremolo');
    }

    if (player.filters.vaporwave) {
      filtersField.push('Vaporwave');
    }

    if (player.filters.vibrato) {
      filtersField.push('Vibrato');
    }

    const nowPlayingEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Now Playing')
      .setDescription(`[${currentTrackTitle}](${player.queue.current.uri})`)
      .setThumbnail(player.queue.current.thumbnail)
      .addFields(
        { name: 'Requested by', value: `<@${currentTrack.requester}>`, inline: true },
        { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
        { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
        { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
        { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
        { name: 'Filter(s)', value: `**\`${filtersField.join('\n') || 'NONE'}\`**`, inline: true },
      );

    interaction.reply({ embeds: [nowPlayingEmbed] });
  },
};
