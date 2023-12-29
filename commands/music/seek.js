const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const formatDuration = require('format-duration');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific time in the current song. Ex. 0:50, 3:30, 01:20:00.')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('Specify the time to seek to in the format 00:00:00 (hh:mm:ss).')
        .setRequired(true)),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to seek in the track!');
      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to seek in the track!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing!');
      return interaction.reply({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    const timeString = interaction.options.getString('time');
    const timeInSeconds = parseTimeToSeconds(timeString);

    if (isNaN(timeInSeconds) || timeInSeconds < 0 || timeInSeconds >= player.queue.current.duration) {
      const invalidTimeEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Invalid time format or time exceeds the duration of the track.');
      return interaction.reply({
        embeds: [invalidTimeEmbed],
        ephemeral: true,
      });
    }

    const durationInSeconds = Math.floor(player.queue.current.duration / 1000);

    if (timeInSeconds <= durationInSeconds) {
      player.seek(timeInSeconds * 1000); 
      const successEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`⏩ | Seeked to \`${formatDuration(timeInSeconds * 1000)}\`.`)
        .setTimestamp();
      return interaction.reply({
        embeds: [successEmbed],
      });
    } else {
      const invalidTimeEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Invalid time format or time exceeds the duration of the track.');
      return interaction.reply({
        embeds: [invalidTimeEmbed],
        ephemeral: true,
      });
    }
  },
};

function parseTimeToSeconds(timeString) {
  const timeParts = timeString.split(':').map(part => parseInt(part, 10));

  if (timeParts.length === 3) {
    return (timeParts[0] * 3600) + (timeParts[1] * 60) + timeParts[2];
  } else if (timeParts.length === 2) {
    return (timeParts[0] * 60) + timeParts[1];
  } else if (timeParts.length === 1) {
    return timeParts[0];
  } else {
    return NaN;
  }
}