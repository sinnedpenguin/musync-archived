let hasUserSetVolume = false;
let volume = 80;

module.exports = {
  setHasUserSetVolume: function(value) {
    hasUserSetVolume = value;
  },
  getHasUserSetVolume: function() {
    return hasUserSetVolume;
  },
  setVolume: function(value) {
    volume = value;
  },
  getVolume: function() {
    return volume;
  },
};
