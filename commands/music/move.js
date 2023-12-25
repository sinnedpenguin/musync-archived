const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a song from the queue.')
    .addIntegerOption(option => option
      .setName('current')
      .setDescription('Current position of the song to move.')
      .setRequired(true)
      .setMinValue(1))
    .addIntegerOption(option => option
      .setName('new')
      .setDescription('New position for the song.')
      .setRequired(true)
      .setMinValue(1)),

  execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const currentPosition = interaction.options.getInteger('current');
    const newPosition = interaction.options.getInteger('new');
    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to move a song from the queue!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to move a song from the queue!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    if (!player || !player.queue || player.queue.length === 0) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No songs are currently in the queue!');

      return interaction.reply({ embeds: [noSongsEmbed], ephemeral: true });
    }

    if (currentPosition > player.queue.length || newPosition > player.queue.length || currentPosition < 1 || newPosition < 1) {
      const invalidNumberEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Invalid song positions. Please enter valid positions in the queue.');

      return interaction.reply({ embeds: [invalidNumberEmbed], ephemeral: true });
    }

    const fromIndex = currentPosition - 1;
    const toIndex = newPosition - 1;

    const movedSong = player.queue.splice(fromIndex, 1)[0];
    player.queue.splice(toIndex, 0, movedSong);

    const moveEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:arrow_double_up: | Moved song from position ${currentPosition} to ${newPosition}. [${movedSong.title}](${movedSong.uri}).`)
      .setTimestamp();

    interaction.reply({ embeds: [moveEmbed] });
  },
};
