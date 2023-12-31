let voteSkipEnabled = true;
let voteStopEnabled = true;

module.exports = {
  getVoteStopEnabled: () => voteStopEnabled,
  setVoteStopEnabled: (value) => {
    voteStopEnabled = value;
  },

  getVoteSkipEnabled: () => voteSkipEnabled,
  setVoteSkipEnabled: (value) => {
    voteSkipEnabled = value;
  },
};