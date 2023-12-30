const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel.'),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to use this command!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player) {
      const notInChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Currently not in a voice channel.')

      return interaction.reply({ embeds: [notInChannelEmbed], ephemeral: true });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to use this command!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    if (player.queue.length > 0 || player.playing) {
      const notEmptyQueueEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There are songs in the queue or a song is currently playing!')

      return interaction.reply({ embeds: [notEmptyQueueEmbed], ephemeral: true });
    }

    player.destroy();

    const leaveEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:wave: | Left the voice channel: \`${voiceChannel.name}\`.`)
      .setTimestamp();

    return interaction.reply({ embeds: [leaveEmbed] });
  },
};