let playedTracks = [];

const autoplay = async (player, track) => {
  const requester = player.get("requester");
  const identifier = track.identifier;
  const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
  const result = await player.search(search, requester);

  if (result.exception) {
    console.error(`Error searching for the next track in the playlist: ${result.exception.message}`);
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
    console.log("No next track available.");
  }
};

module.exports = autoplay;