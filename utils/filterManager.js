let bassBoost = false;

function toggleBassBoost() {
  bassBoost = !bassBoost;
  return bassBoost;
}

function getBassBoostStatus() {
  return bassBoost;
}

module.exports = {
  toggleBassBoost,
  getBassBoostStatus,
};
