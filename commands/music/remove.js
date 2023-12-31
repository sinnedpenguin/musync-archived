const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a specific song from the queue.')
    .addIntegerOption(option => option
      .setName('number')
      .setDescription('Number of the song to remove.')
      .setRequired(true)
      .setMinValue(1)),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const songNumber = interaction.options.getInteger('number');
    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to remove a song from the </queue:1190439304183414881>!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    if (!player || !player.queue || player.queue.length === 0) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No songs are currently in the </queue:1190439304183414881>!');

      return interaction.reply({ embeds: [noSongsEmbed], ephemeral: true });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to remove a song from the </queue:1190439304183414881>!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    if (songNumber > player.queue.length) {
      const invalidNumberEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Invalid song number. Please enter a valid number in the </queue:1190439304183414881>.');

      return interaction.reply({ embeds: [invalidNumberEmbed], ephemeral: true });
    }

    const removedSong = player.queue[songNumber - 1];
    player.queue.remove(songNumber - 1);

    const messages = await interaction.channel.messages.fetch({ limit: 3 });

    const removeMessage = messages.find(message =>
      message.author.bot && message.embeds && message.embeds.length > 0 &&
      message.embeds[0].description.startsWith(`:wastebasket: | Removed`)
    );

    if (removeMessage) {
      try {
        await removeMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    await interaction.deferReply();

    const removeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:wastebasket: | Removed ${songNumber}. [${removedSong.title}](${removedSong.uri}). Use </queue:1190439304183414881> to see the current order.`)
      .setTimestamp();

    interaction.followUp({ embeds: [removeEmbed] });
  },
};