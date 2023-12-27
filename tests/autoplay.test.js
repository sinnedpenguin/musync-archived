require('dotenv').config();
require('../lib/client');

const autoplay = require('../lib/autoplay');

test('should play the next track in autoplay mode', async () => {
  const mockPlayer = {
    get: jest.fn((key) => key === "autoplay"),
    queue: {
      current: { identifier: 'current_track_identifier', uri: 'current_track_uri' },
      add: jest.fn(),
    },
    play: jest.fn(),
    search: jest.fn().mockResolvedValue({
      exception: null,
      tracks: [{ identifier: 'next_track_identifier' }],
    }),
  };

  const mockTrack = { identifier: 'current_track_identifier' };

  await autoplay(mockPlayer, mockTrack);

  expect(mockPlayer.queue.add).toHaveBeenCalledWith({ identifier: 'next_track_identifier' });
  expect(mockPlayer.play).toHaveBeenCalled();
});

test('should play the next track when the current track is at index 50', async () => {
  const mockPlayer = {
    get: jest.fn((key) => key === "autoplay"),
    queue: {
      current: { identifier: 'track_index=50_identifier', uri: 'current_track_uri' },
      add: jest.fn(),
    },
    play: jest.fn(),
    search: jest.fn().mockResolvedValue({
      exception: null,
      tracks: Array.from({ length: 100 }, (_, index) => ({ identifier: `track_index=${index}_identifier` })),
    }),
  };

  await autoplay(mockPlayer, mockPlayer.queue.current);

  expect(mockPlayer.queue.add).toHaveBeenCalledWith({ identifier: 'track_index=51_identifier' });
  expect(mockPlayer.play).toHaveBeenCalled();
});