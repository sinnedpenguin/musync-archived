const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing song.'),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to </pause:1190439304183414878> a song!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to </pause:1190439304183414878> a song!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing!')

      return interaction.reply({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    if (!player.playing) {
      const songAlreadyPausedEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Current song is already paused!')

      return interaction.reply({
        embeds: [songAlreadyPausedEmbed],
        ephemeral: true,
      });
    }

    player.pause(true);

    const pauseEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(':pause_button: | Paused the current song! Use </resume:1190439304183414884> to resume.')
      .setTimestamp();

    interaction.reply({
      embeds: [pauseEmbed],
    });
  },
};
