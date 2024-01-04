const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the current queue.'),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to ${config.commands.shuffle} the ${config.commands.queue}!`);

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No songs are currently playing!')

      return interaction.reply({ embeds: [noSongEmbed] , ephemeral: true });
    }

    if (player.queue.length < 2) {
      const notEnoughSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | There's not enough songs in the ${config.commands.queue} to ${config.commands.shuffle}!`)

      return interaction.reply({ embeds: [notEnoughSongsEmbed] , ephemeral: true });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to shuffle the ${config.commands.queue}!`);
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });
    
    const shuffleMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].description === `:twisted_rightwards_arrows: | The queue has been shuffled! Use ${config.commands.queue} to see the current order.`
    );
  
    if (shuffleMessage) {
      try {
        await shuffleMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    player.queue.shuffle();
    player.queue.isShuffled = true;

    const shuffleStatusEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:twisted_rightwards_arrows: | The queue has been shuffled! Use ${config.commands.queue} to see the current order.`)
      .setTimestamp();

    interaction.reply({
      embeds: [shuffleStatusEmbed],
    });
  },
};