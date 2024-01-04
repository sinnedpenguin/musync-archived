const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const logger = require('../../utils/logger');

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
        .setDescription(`:x: | You need to be in a voice channel to ${config.commands.pause} a song!`)

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to ${config.commands.pause} a song!`);
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | There is no song currently playing! Use ${config.commands.play} to play a song!`)

      return interaction.reply({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    if (!player.playing) {
      const songAlreadyPausedEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | Current song is already paused! Do you mean ${config.commands.resume}?`)

      return interaction.reply({
        embeds: [songAlreadyPausedEmbed],
        ephemeral: true,
      });
    }

    player.pause(true);

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });

    const resumeMessage = messages.find(message => 
      message.author.bot && 
      message.embeds[0].description === `:arrow_forward: | Resumed the current song! Use ${config.commands.pause} to pause.`
    )

    if (resumeMessage) {
      try {
        await resumeMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    const pauseEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:arrow_forward: | Resumed the current song! Use ${config.commands.pause} to pause.`)
      .setTimestamp();

    interaction.reply({
      embeds: [pauseEmbed],
    });
  },
};
