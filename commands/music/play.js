const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkTopGGVote } = require('../../utils/topgg')
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song/album/playlist from YouTube, Spotify, Deezer, or SoundCloud.')
    .addStringOption((option) =>
      option.setName('query').setDescription('Title/URL/keyword(s)')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const query = interaction.options.getString('query');
    const commandName = interaction.commandName;

    logger.info(`"${userId}" executed "${commandName}" with query: "${query}".`);

    if (!interaction.member.voice.channel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to play a song! Please try again: </play:1190439304183414879>.');

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);
    
    let volume = 80;
    
    const hasVoted = await checkTopGGVote(userId);
    
    if (hasVoted) {
      volume = 100;
      logger.info(`"${userId}" has voted. Setting volume to "100".`);
    } else {
      logger.warn(`"${userId}" has not voted. Setting default volume to "80".`);
    }

    if (!player) {
      player = interaction.client.manager.create({
        guild: interaction.guild.id,
        voiceChannel: interaction.member.voice.channel.id,
        textChannel: interaction.channel.id,
        volume: volume,
        selfDeafen: true,
      });
    }

    const results = await interaction.client.manager.search(query);

    if (!results.tracks || results.tracks.length === 0) {
      logger.error(`No results found for ${userId}'s query: "${query}".`);

      const notFoundEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No results found for the given query. Please try again: </play:1190439304183414879>.');

      return interaction.reply({
        embeds: [notFoundEmbed],
        ephemeral: true,
      });
    }

    results.tracks.forEach((track) => (track.requester = interaction.user.id));

    if (results.playlist || results.loadType === 'PLAYLIST') {
      player.queue.add(results.tracks);

      const playlistEmbed = new EmbedBuilder()
        .setTitle('Added to Queue')
        .setDescription(`${results.playlist.name}`)
        .setThumbnail(results.tracks[0].thumbnail)
        .addFields(
          { name: 'Added by', value: `<@${interaction.user.id}>`, inline: true }
        );

      interaction.reply({ embeds: [playlistEmbed] }).then((msg) => {
        setTimeout(() => msg.delete(), 5000);
      });

      if (!player.playing && !player.paused) {
        player.connect();
        player.play();
      }
    } else {
      player.queue.add(results.tracks[0]);

      const addedToQueueEmbed = new EmbedBuilder()
        .setTitle('Added to Queue')
        .setDescription(
          `${results.tracks[0].title}`
        )
        .setThumbnail(results.tracks[0].thumbnail)
        .addFields(
          { name: 'Added by', value: `<@${interaction.user.id}>`, inline: true }
        );

      interaction.reply({ embeds: [addedToQueueEmbed] }).then((msg) => {
        setTimeout(() => msg.delete(), 5000);
      });

      if (!player.playing && !player.paused) {
        player.connect();
        player.play();
      }
    }
  },
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    const results = await interaction.client.manager.search(focusedValue);
    const tracks = results.tracks.slice(0, 5);

    const options = tracks.map(track => ({
      name: track.title,
      value: track.uri,
    }));

    await interaction.respond(options);
  }
};
