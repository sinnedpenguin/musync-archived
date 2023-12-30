const { EmbedBuilder } = require('discord.js');
const client = require('../lib/client');
const formatDuration = require('format-duration');
const filterManager = require('../lib/filterManager');
const checkTopGGVote = require('../lib/topgg');
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

client.manager.on("playerDestroy", () => {
  logger.warn('Player has been destroyed.');
});

client.manager.on("trackError", (player, track, payload) => {
  logger.error(`An error occurred while playing the track: ${track.title}. Error: ${payload.error}.`);

  const channel = client.channels.cache.get(player.textChannel);

  channel.send({
    content: `:x: | An error occurred while playing the track. Please try again later. Error: \`${payload.error}\`.`,
    ephemeral: true
  });
});

client.manager.on("trackStuck", (player, track) => {
  logger.error(`Track got stuck: ${track.title}.`);

  const channel = client.channels.cache.get(player.textChannel);

  channel.send({
    content: `:x: | An error occurred while playing the track: \`${track.title}\`. Please try again later.`,
    ephemeral: true
  });
});

client.manager.on("trackStart", async player => {
  const currentTrack = player.queue.current;
  const currentTrackTitle = currentTrack && currentTrack.title ? currentTrack.title : "NA";

  logger.info(`"${client.user.tag}" started playing: "${currentTrackTitle}".`);

  const channel = client.channels.cache.get(player.textChannel);

  const messages = await channel.messages.fetch({ limit: 3 });
  const nowPlayingMessage = messages.find(message => 
    message.author.bot && 
    message.embeds.length > 0 && 
    message.embeds[0].title && 
    message.embeds[0].title === 'Now Playing'
  );

  if (nowPlayingMessage) {
    await nowPlayingMessage.delete();
  }

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

  if (player.filters.lowPass) {
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
      { name: 'Requested by', value: `<@${currentTrack.requester}>`, inline: true },
      { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
      { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
      { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
      { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
      { name: 'Filter(s)', value: `**\`${filtersField.join('\n') || 'NONE'}\`**`, inline: true },
    );
  
  channel.send({ embeds: [nowPlayingEmbed] });
});

client.manager.on("queueEnd", async (player, track) => {
  const autoplayEnabled = player.get("autoplay");

  if (autoplayEnabled) {
    const channel = client.channels.cache.get(player.textChannel);
    const requester = player.get("requester");
  
    const hasVoted = await checkTopGGVote(requester);
  
    /* if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:warning: | Your \`12 hours\` access to \`autoplay\` has expired. To use \`autoplay\` again, please cast your vote on \`Top.gg\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`filters\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
        });
      
      await channel.send({
        embeds: [responseEmbed],
      });
      return;
    }; */

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
  } else {
    if (player && player.state === "CONNECTED") {
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
      }

      logger.info(`Queue concluded.`);

      const queueEmptyEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:white_check_mark: | Queue concluded! Play more songs by using </play:1190439304183414879>!\n\nEnjoying \`Musnyc!\`? Please consider:\n\n✨ [Support Server](${config.supportServer}) | [Vote](${config.vote}) | [Donate/Sponsor](${config.donate}) | [Invite](${config.invite})`)
        .setTimestamp();

      const channel = client.channels.cache.get(player.textChannel);
      channel.send({ embeds: [queueEmptyEmbed] });
      player.destroy();
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

client.on("raw", d => client.manager.updateVoiceState(d));