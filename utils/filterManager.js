let filters = {
  bassBoost: false,
  eightd: false,
  karaoke: false,
  nightcore: false,
  soft: false,
  tremolo: false,
  vaporwave: false,
  vibrato: false,
};

function toggleFilter(filterName) {
  if (Object.prototype.hasOwnProperty.call(filters, filterName)) {
    filters[filterName] = !filters[filterName];
    return filters[filterName];
  } else {
    return false;
  }
}

function getFilterStatus(filterName) {
  return Object.prototype.hasOwnProperty.call(filters, filterName) ? filters[filterName] : null;
}

function resetFilters() {
  for (const filterName in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, filterName)) {
      filters[filterName] = false;
    }
  }
}

module.exports = {
  toggleFilter,
  getFilterStatus,
  resetFilters,
};
