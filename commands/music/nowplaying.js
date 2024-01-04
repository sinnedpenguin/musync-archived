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
        .setDescription(`:x: | There is no song currently playing! Use ${config.commands.play} to play a song!`)

      return interaction.reply({ embeds: [noSongEmbed], ephemeral: true });
    }

    const currentTrack = player.queue.current;
    const currentTrackTitle = currentTrack && currentTrack.title ? currentTrack.title : "NA";

    const repeatMode = player.trackRepeat ? 'ON' : 'OFF';

    const filtersStatus = [
      { name: 'Bass Boost', status: filterManager.getFilterStatus('bassBoost') },
      { name: '8D', status: filterManager.getFilterStatus('eightd') },
      { name: 'Karaoke', status: filterManager.getFilterStatus('karaoke') },
      { name: 'Nightcore', status: filterManager.getFilterStatus('nightcore') },
      { name: 'Soft', status: filterManager.getFilterStatus('soft') },
      { name: 'Tremolo', status: filterManager.getFilterStatus('tremolo') },
      { name: 'Vaporwave', status: filterManager.getFilterStatus('vaporwave') },
      { name: 'Vibrato', status: filterManager.getFilterStatus('vibrato') },
    ];
    
    const filtersField = filtersStatus
      .filter(({ status }) => status)
      .map(({ name }) => `${name}`);
    
    const filtersFieldText = filtersField.join('\n');
    
    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });
    
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

    const nowPlayingEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Now Playing')
      .setDescription(
        `[${`${currentTrackTitle}`}](${currentTrack && currentTrack.uri ? currentTrack.uri : ''})`
      )
      .setThumbnail(player.queue.current.thumbnail)
      .addFields(
        { name: 'Requested by', value: `<@${currentTrack.requester}>`, inline: true },
        { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
        { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
        { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
        { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
        { name: 'Filter(s)', value: `**\`${filtersFieldText || 'NONE'}\`**`, inline: true },
      );

    interaction.reply({ embeds: [nowPlayingEmbed] });
  },
};
