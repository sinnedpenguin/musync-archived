const logger = require('./logger');

async function autoPlay(player, track) {
  const requester = player.get("requester");
  const playedTracks = player.get("playedTracks");
  playedTracks.push(track.identifier);

  if (track.sourceName === "spotify") {
    const currentTrackTitle = track.title;
    const currentTrackAuthor = track.author;
    const currentTrackResult = await player.search(`${currentTrackTitle} - ${currentTrackAuthor}`);

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

    const nextTrack = result.tracks.slice(1).find((t) => !playedTracks.includes(t.identifier));

    if (nextTrack) {
      playedTracks.push(nextTrack.identifier);
      player.queue.add(nextTrack);
      player.play();
    } else {
      logger.warn("No next track available.");
    }
  } else {
    const search = `https://www.youtube.com/watch?v=${track.identifier}&list=RD${track.identifier}`;
    const result = await player.search(search, requester);

    if (result.exception) {
      logger.error(`Error searching for the next track: ${result.exception.message}`);
      return;
    }

    const nextTrack = result.tracks.find((t) => !playedTracks.includes(t.identifier));

    if (nextTrack) {
      player.queue.add(nextTrack);
      player.play();
      playedTracks.push(nextTrack.identifier);
    } else {
      logger.warn("No next track available.");
    }
  }
}

module.exports = autoPlay;
