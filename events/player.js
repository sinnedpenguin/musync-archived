const { EmbedBuilder } = require('discord.js');
const client = require('../lib/client');
const formatDuration = require('format-duration');
const filterManager = require('../lib/filterManager');
const autoplay = require('../lib/autoplay');
const config = require('../config.json');
const logger = require('../lib/logger');

client.manager.on("nodeConnect", node => {
  logger.info(`Node "${node.options.identifier}" connected.`);
})

client.manager.on("nodeReconnect", node => {
  logger.warn(`Node "${node.options.identifier}" reconnecting.`);
});

client.manager.on("nodeDisconnect", node => {
  logger.error(`Node "${node.options.identifier}" disconnected.`);
});

client.manager.on("nodeError", (node, error) => {
  logger.error(`Node "${node.options.identifier}" encountered an error: ${error.message}.`);
});

client.manager.on("nodeDestroy", node => {
  logger.warn(`Node "${node.options.identifier}" destroyed.`);
});

client.manager.on("playerDestroy", player => {
 logger.warn('Player has been destroyed.');
});

client.manager.on("trackError", (player, track, payload) => {
  logger.error(`An error occurred while playing the track: ${track.title}. Error: ${payload.error}.`);

  const channel = client.channels.cache.get(player.textChannel);

  channel.send({
    content: `:x: | An error occurred while playing the track. Please try again later. Error: ${payload.error}.`,
    ephemeral: true
  });
});

client.manager.on("trackStuck", (player, track) => {
  logger.error(`Track got stuck: ${track.title}.`);

  const channel = client.channels.cache.get(player.textChannel);

  channel.send({
    content: `:x: | An error occurred while playing the track. Please try again later. Track got stuck: ${track.title}.`,
    ephemeral: true
  });
});

client.manager.on("trackStart", async player => {
  const currentTrack = player.queue.current;
  const currentTrackTitle = currentTrack && currentTrack.title ? currentTrack.title : "NA";

  logger.info(`${client.user.tag} started playing: "${currentTrackTitle}".`);

  const channel = client.channels.cache.get(player.textChannel);

  const repeatMode = player.trackRepeat ? 'ON' : 'OFF';

  const bassBoostStatus = filterManager.getBassBoostStatus();

  const filtersField = [];
  
  if (bassBoostStatus) {
    filtersField.push('Bass Boost');
  }

  if (player.filters.rotating) {
    filtersField.push('8D');
  }

  if (player.filters.karaoke) {
    filtersField.push('Karaoke');
  }

  if (player.filters.nightcore) {
    filtersField.push('Nightcore');
  }

  if (player.filters.lowpass) {
    filtersField.push('Soft');
  }

  if (player.filters.tremolo) {
    filtersField.push('Tremolo');
  }

  if (player.filters.vaporwave) {
    filtersField.push('Vaporwave');
  }

  if (player.filters.vibrato) {
    filtersField.push('Vibrato');
  }

  const nowPlayingEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('Now Playing')
    .setDescription(
      `[${currentTrack.sourceName === "spotify" ? `${currentTrackTitle} - ${currentTrack.author}` : `${currentTrackTitle}`} ](${currentTrack.uri})`
    )
    .setThumbnail(currentTrack.thumbnail)
    .addFields(
      { name: 'Requested by', value: `<@${currentTrack.requester || track.requester}>`, inline: true },
      { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
      { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
      { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
      { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
      { name: 'Filter(s)', value: `**\`${filtersField.join('\n') || 'NONE'}\`**`, inline: true },
    );
  
  setTimeout(() => {
    channel.send({ embeds: [nowPlayingEmbed] });
  }, 1000);
});

client.manager.on("queueEnd", async (player, track) => {
  const autoplayEnabled = player.get("autoplay");

  if (autoplayEnabled) {
    await autoplay(player, track);
  } else {
    if (player && player.state === "CONNECTED") {
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
      }

      player.disconnectTimeout = setTimeout(() => {
        logger.warn(`Queue is empty.`);

        const queueEmptyEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:warning: | Left the voice channel as the queue is empty.`)
          .setTimestamp();

        const channel = client.channels.cache.get(player.textChannel);
        channel.send({ embeds: [queueEmptyEmbed] });
        player.destroy();
      }, config.disconnectTime);
    }
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  const guildId = newState.guild.id;
  const player = client.manager.get(guildId);

  if (player && player.state === "CONNECTED") {
    if (player.disconnectTimeout) {
      clearTimeout(player.disconnectTimeout);
    }

    setTimeout(async () => {
      const updatedState = newState.guild.voiceStates.cache.get(client.user.id);
      const alone = updatedState &&
        updatedState.channel &&
        updatedState.channel.members &&
        updatedState.channel.members.size === 1 &&
        updatedState.channel.members.first().id === client.user.id;

      const channel = client.channels.cache.get(player.textChannel);

      if (alone || (!player.playing && player.queue.size === 0)) {
        player.disconnectTimeout = setTimeout(() => {
          if (alone) {
            logger.warn(`No one left in the voice channel.`);

            const aloneEmbed = new EmbedBuilder()
              .setColor(config.embedColor)
              .setDescription(`:warning: | Left the voice channel as it was empty.`)
              .setTimestamp();

            channel.send({ embeds: [aloneEmbed] });
          } else {
            logger.warn(`No activity.`);

            const noActivityEmbed = new EmbedBuilder()
              .setColor(config.embedColor)
              .setDescription(`:warning: | Left the voice channel due to inactivity.`)
              .setTimestamp();

            channel.send({ embeds: [noActivityEmbed] });
          }
          player.destroy();
        }, config.disconnectTime);
      }
    }, 1000);
  }
});

client.on("raw", d => client.manager.updateVoiceState(d))