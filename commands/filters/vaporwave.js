const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkTopGGVoteAndRespond  } = require('../../utils/topgg');
const filterManager = require('../../utils/filterManager');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-vaporwave')
    .setDescription('Toggle Vaporwave filter.'),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    if (!await checkTopGGVoteAndRespond(interaction, commandName)) {
      return;
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing! Use </play:1190439304183414879> to play a song!')

      return interaction.reply({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to toggle \`${commandName}\`!`);
  
      return interaction.reply({ 
        embeds: [sameVoiceChannelEmbed], 
        ephemeral: true 
      });
    }

    player.toggleVaporwave();
    filterManager.toggleFilter('vaporwave');

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });

    const filterMessage = messages.find(message =>
      message.author.bot &&
      message.embeds.length > 0 &&
      message.embeds[0].description &&
      (message.embeds[0].description.includes('filter is now') ||
        message.embeds[0].description.includes('Filters have been reset'))
    );

    if (filterMessage) {
      try {
        await filterMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    await interaction.deferReply();

    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | \`Vaporwave\` filter is now ${player.filters.vaporwave ? '`enabled`' : '`disabled`'}! Use </nowplaying:1190439304183414877> to see all enabled filters.`)
      .setTimestamp();

    interaction.followUp({
        embeds: [filterEmbed],
    });
  },
};
