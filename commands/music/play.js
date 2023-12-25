const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const formatDuration = require('format-duration');
const checkTopGGVote = require('../../lib/topgg')
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const logFilePath = path.join(__dirname, '../../logs.txt');

function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`, 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song/album/playlist from YouTube, Spotify, Deezer, SoundCloud, or Apple Music.')
    .addStringOption((option) =>
      option.setName('query').setDescription('Title/URL/keyword(s)')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const query = interaction.options.getString('query');

    await interaction.deferReply();

    logToFile(`User executed /play with query: "${query}".`);

    if (!interaction.member.voice.channel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to play a song!');

      return interaction.followUp({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    if (!userId) {
      console.error("User ID is undefined");
    }
    
    let volume = 90;
    
    const hasVoted = await checkTopGGVote(userId);
    
    if (hasVoted) {
      volume = 100;
      console.log(`User has voted. Setting volume to 100.`);
      logToFile(`User has voted. Setting volume to 100.`);
    } else {
      console.log(`User has not voted. Setting default volume to 90.`);
      logToFile(`User has not voted. Setting default volume to 90.`);
    }

    if (!player) {
      player = interaction.client.manager.create({
        guild: interaction.guild.id,
        voiceChannel: interaction.member.voice.channel.id,
        textChannel: interaction.channel.id,
        volume: volume,
        selfDeafen: true,
        instaUpdateFiltersFix: true,
      });
    }

    const results = await interaction.client.manager.search(
      { 
        query: query, 
        source: "yt" || "sp", 
      }
    );

    if (!results.tracks || results.tracks.length === 0) {
      logToFile(`No results found for: "${query}".`);

      const notFoundEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No results found for the given query.');

      return interaction.followUp({
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

      interaction.followUp({ embeds: [playlistEmbed] }).then((msg) => {
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
        .setDescription(`[${results.tracks[0].title}](${results.tracks[0].uri})`)
        .setThumbnail(results.tracks[0].thumbnail)
        .addFields(
          { name: 'Added by', value: `<@${interaction.user.id}>`, inline: true }
        );

      interaction.followUp({ embeds: [addedToQueueEmbed] }).then((msg) => {
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
