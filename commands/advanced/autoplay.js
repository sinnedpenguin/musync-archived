const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkTopGGVoteAndRespond  } = require('../../utils/topgg');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay. Automatically adds and plays similar songs to the queue.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    logger.info(`"${userId}" executed "${commandName}".`);

    /* if (!await checkTopGGVoteAndRespond(interaction, commandName)) {
      return;
    } */

    if (!interaction.member.voice.channel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to toggle `Autoplay`! Please try again: </autoplay:1190439303931772978>.');

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    player.set('requester', interaction.user.id);
    player.set('autoplay', !player.get('autoplay'));
    player.set('playedTracks', []);

    logger.info(`User: "${userId}" successfully toggled "${commandName}".`);

    await interaction.deferReply();

    const autoPlayEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | \`Autoplay\` is now \`${player.get('autoplay') ? 'ON' : 'OFF'}\`! Use </nowplaying:1190439304183414877> to see the current status.`)
      .setTimestamp();

    return interaction.followUp({
      embeds: [autoPlayEmbed],
    });
  }
};
