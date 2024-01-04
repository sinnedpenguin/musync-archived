const { EmbedBuilder } = require('discord.js');
const client = require('../client');
const formatDuration = require('format-duration');
const filterManager = require('../utils/filterManager');
const { checkTopGGVote } = require('../utils/topgg');
const autoPlay = require('../utils/autoPlayer');
const config = require('../config.json');
const logger = require('../utils/logger');

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

  const errorEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setDescription(`:x: | An error occurred while playing the track: \`${track.title}\`. Please try again later.`)
    .setTimestamp();

  channel.send({ embeds: [errorEmbed] });
});

client.manager.on("trackStuck", (player, track) => {
  logger.error(`Track got stuck: ${track.title}.`);

  const channel = client.channels.cache.get(player.textChannel);

  const errorEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setDescription(`:x: | An error occurred while playing the track: \`${track.title}\`. Please try again later.`)
    .setTimestamp();

  channel.send({ embeds: [errorEmbed] });
});

client.manager.on("trackStart", async player => {
  const currentTrack = player.queue.current;
  const currentTrackTitle = currentTrack && currentTrack.title ? currentTrack.title : "NA";

  logger.info(`"${client.user.tag}" started playing: "${currentTrackTitle}".`);

  const channel = client.channels.cache.get(player.textChannel);

  const messages = await channel.messages.fetch({ limit: config.deleteLimit });
  const nowPlayingMessage = messages.find(message => 
    message.author.bot && 
    message.embeds.length > 0 && 
    message.embeds[0].title && 
    message.embeds[0].title === 'Now Playing'
  );

  if (nowPlayingMessage) {
    try {
      await nowPlayingMessage.delete();
    } catch (error) {
      logger.error(`Failed to delete message: ${error}`);
    }
  }

  const repeatMode = player.trackRepeat ? 'ON' : 'OFF';

  const filtersStatus = [
    { name: 'Bass Boost', status: filterManager.getFilterStatus('bassBoost') },
    { name: '8D', status: filterManager.getFilterStatus('eightd') },
    { name: 'Karaoke', status: filterManager.getFilterStatus('karaoke') },
    { name: 'Nightcore', status: filterManager.getFilterStatus('nightcore') },
    { name: 'Soft', status: filterManager.getFilterStatus('soft') },
    { name: 'Tremolo', status: filterManager.getFilterStatus('tremolo') },
    { name: 'Vaporwave', status: filterManager.getFilterStatus('vaporwave') },
    { name: 'Vibrato', status: filterManager.getFilterStatus('vibrato') },
  ];
  
  const filtersField = filtersStatus
    .filter(({ status }) => status)
    .map(({ name }) => `${name}`);
  
  const filtersFieldText = filtersField.join('\n');

  const nowPlayingEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('Now Playing')
    .setDescription(
      `[${`${currentTrackTitle}`}](${currentTrack && currentTrack.uri ? currentTrack.uri : ''})`
    )
    .setThumbnail(currentTrack.thumbnail)
    .addFields(
      { name: 'Requested by', value: `<@${currentTrack.requester}>`, inline: true },
      { name: 'Duration', value: `**\`${formatDuration(currentTrack.duration)}\`**`, inline: true },
      { name: 'Volume', value: `**\`${player.volume}%\`**`, inline: true },
      { name: 'Repeat', value: `**\`${repeatMode}\`**`, inline: true },
      { name: 'Autoplay', value: `**\`${player.get('autoplay') ? 'ON' : 'OFF'}\`**`, inline: true },
      { name: 'Filter(s)', value: `**\`${filtersFieldText || 'NONE'}\`**`, inline: true },
    );
  
  channel.send({ embeds: [nowPlayingEmbed] });
});

client.manager.on("queueEnd", async (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);

  const messages = await channel.messages.fetch({ limit: config.deleteLimit });

  const nowPlayingMessage = messages.find(message => 
    message.author.bot && 
    message.embeds.length > 0 && 
    message.embeds[0].title && 
    message.embeds[0].title === 'Now Playing'
  );

  if (nowPlayingMessage) {
    try {
    await nowPlayingMessage.delete();
    } catch (error) {
      logger.error(`Failed to delete message: ${error}`);
    }
  }

  const autoplayEnabled = player.get("autoplay");

  if (autoplayEnabled) {
    const channel = client.channels.cache.get(player.textChannel);
    const requester = player.get("requester");
  
    const hasVoted = await checkTopGGVote(requester);
  
    if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:warning: | Your \`12 hours\` access to \`autoplay\` has expired. To use \`autoplay\` again, please cast your vote on \`Top.gg\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`filters\`, \`lyrics\`, \`volume\`, \`100% default volume\`, and more—coming soon!\n\n✨ **[Vote now!](${config.vote})**`,
        });
      
      await channel.send({
        embeds: [responseEmbed],
      });
      return;
    }
    
    await autoPlay(player, track);
  } else {
    if (player && player.state === "CONNECTED") {
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
      }

      logger.info(`Queue concluded.`);

      const queueEmptyEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:white_check_mark: | Queue concluded! Play more songs by using ${config.commands.play}!\n\nEnjoying \`Musnyc!\`? Please consider:\n\n✨ [Support Server](${config.supportServer}) | [Vote](${config.vote}) | [Donate/Sponsor](${config.donate}) | [Invite](${config.invite})`)
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