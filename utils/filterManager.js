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
  if (filters.hasOwnProperty(filterName)) {
    filters[filterName] = !filters[filterName];
    return filters[filterName];
  } else {
    return false;
  }
}

function getFilterStatus(filterName) {
  return filters.hasOwnProperty(filterName) ? filters[filterName] : null;
}

function resetFilters() {
  for (const filterName in filters) {
    if (filters.hasOwnProperty(filterName)) {
      filters[filterName] = false;
    }
  }
}

module.exports = {
  toggleFilter,
  getFilterStatus,
  resetFilters,
};
