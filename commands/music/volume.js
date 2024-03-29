const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkTopGGVoteAndRespond  } = require('../../utils/topgg');
const volumeManager = require('../../utils/volumeManager');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust the volume of music playback.')
    .addIntegerOption(option => option
      .setName('level')
      .setDescription('Volume level (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    const commandName = interaction.commandName;
    const voiceChannel = member.voice.channel;
    const volumeLevel = interaction.options.getInteger('level');

    logger.info(`"${userId}" executed "${commandName}".`);

    if (!await checkTopGGVoteAndRespond(interaction, commandName)) {
      return;
    }

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to adjust the ${config.commands.volume} of music playback!`)

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to adjust the ${config.commands.volume} of music playback!`);
  
      return interaction.followUp({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | No songs are currently playing! Use ${config.commands.play} to play a song!`);

      return interaction.reply({ embeds: [noSongsEmbed], ephemeral: true });
    }

    player.setVolume(volumeLevel);
    player.volume = volumeLevel; 
    volumeManager.setHasUserSetVolume(true);

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });

    const volumeMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].description && 
      message.embeds[0].description === `:sound: | Set volume to \`${volumeLevel}\`. Use ${config.commands.nowplaying} to see the current ${config.commands.volume}.` 
    );

    if (volumeMessage) {
      try {
        await volumeMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }
    
    const volumeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:sound: | Set volume to \`${volumeLevel}\`. Use ${config.commands.nowplaying} to see the current ${config.commands.volume}.`)
      .setTimestamp();

    interaction.reply({ embeds: [volumeEmbed] });
  },
};
