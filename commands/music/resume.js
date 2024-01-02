const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song.'),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to </resume:1190439304183414884> a paused song!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
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

    if (player.playing) {
      const songAlreadyPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Current song is already playing! Do you mean </pause:1190439304183414878>?')

      return interaction.reply({
        embeds: [songAlreadyPlayingEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to </resume:1190439304183414884> a paused song!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    player.pause(false);

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });

    const pauseMessage = messages.find(message => 
      message.author.bot && 
      message.embeds[0].description === ':pause_button: | Paused the current song! Use </resume:1190439304183414884> to resume.'
    )

    if (pauseMessage) {
      try {
        await pauseMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }
    
    const resumeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(':arrow_forward: | Resumed the current song! Use </pause:1190439304183414878> to pause.')
      .setTimestamp();

    interaction.reply({
      embeds: [resumeEmbed],
    });
  },
};