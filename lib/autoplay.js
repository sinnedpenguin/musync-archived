const client = require('../lib/client');
const { EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../lib/topgg');
const config = require('../config.json');
const logger = require('../lib/logger');

let playedTracks = [];

const autoplay = async (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  const requester = player.get("requester");

  const hasVoted = await checkTopGGVote(requester);

  if (!hasVoted) {
    const responseEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:warning: | Your \`12 hours\` access to \`autoplay\` has expired. To use \`autoplay\` again, please cast your vote on \`Top.gg\`!`)
      .addFields({
        name: 'Why Vote?',
        value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`filters\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
      })
    
    await channel.send({
      embeds: [responseEmbed],
    });
    return;
  }

  if (track.sourceName === "spotify") {
    const currentTrackTitle = track.title;
    const currentTrackResult = await player.search(currentTrackTitle);

    if (currentTrackResult.exception) {
      logger.error(`Error searching for the current track: ${currentTrackResult.exception.message}`);
      return;
    }

    if (currentTrackResult.tracks.length === 0) {
      logger.warn("No matching track found.");
      return;
    }

    const identifier = currentTrackResult.tracks[0].identifier;

    const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
    const result = await player.search(search, requester);

    if (result.exception) {
      logger.error(`Error searching for the next track in the playlist: ${result.exception.message}`);
      return;
    }

    const nextTrackIndex = 1 % result.tracks.length;
    const nextTrack = result.tracks[nextTrackIndex];

    if (nextTrack) {
      playedTracks.push(nextTrack.identifier);
      player.queue.add(nextTrack);
      player.play();
    } else {
      logger.warn("No next track available.");
    }
  } else {
    const identifier = track.identifier;
    const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
    const result = await player.search(search, requester);
  
    if (result.exception) {
      logger.error(`Error searching for the next track in the playlist: ${result.exception.message}`);
      return;
    }
  
    const currentTrackIndex = result.tracks.findIndex((t) => t.identifier === track.identifier);
    const nextTrackIndex = (currentTrackIndex + 1) % result.tracks.length;
  
    if (nextTrackIndex !== -1) {
      const nextTrack = result.tracks[nextTrackIndex];
      playedTracks.push(nextTrack.identifier);
      player.queue.add(nextTrack);
      player.play();
    } else {
      logger.warn("No next track available.");
    }
  }
};

module.exports = autoplay;