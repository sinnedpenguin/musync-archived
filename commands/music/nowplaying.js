const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const filterManager = require('../../utils/filterManager');
const formatDuration = require('format-duration');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Display the currently playing song.'),
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing! Use </play:1190439304183414879> to play a song!')

      return interaction.reply({ embeds: [noSongEmbed], ephemeral: true });
    }

    const currentTrack = player.queue.current;
    const currentTrackTitle = currentTrack && currentTrack.title ? currentTrack.title : "NA";

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

    if (player.filters.lowPass) {
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
    
    const messages = await interaction.channel.messages.fetch({ limit: 3 });
    const nowPlayingMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].title && 
      message.embeds[0].title === 'Now Playing'
    );
  
    if (nowPlayingMessage) {
      try {
        await nowPlayingMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    await interaction.deferReply();

    const nowPlayingEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Now Playing')
      .setDescription(
        `[${currentTrack.sourceName === "spotify" ? `${currentTrackTitle} - ${currentTrack.author}` : `${currentTrackTitle}`} ](${currentTrack.uri})`
      )
      .setThumbnail(player.queue.current.thumbnail)
      .addFields(
        { name: 'Requested by', value: `<@${currentTrack.requester}>`, inline: true },
        { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
        { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
        { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
        { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
        { name: 'Filter(s)', value: `**\`${filtersField.join('\n') || 'NONE'}\`**`, inline: true },
      );

    interaction.followUp({ embeds: [nowPlayingEmbed] });
  },
};
