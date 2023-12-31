const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteStopEnabled } = require('../../utils/votingManager'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music playback.'),

  async execute(interaction) {
    const voteStopEnabled = getVoteStopEnabled();
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to </stop:1190439304405733390> the music playback!\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to </stop:1190439304405733390> the music playback!\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | There is no music playback to </stop:1190439304405733390>!\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)

      return interaction.reply({ embeds: [noSongEmbed], ephemeral: true });
    }

    const members = voiceChannel.members.filter(m => !m.user.bot);

    if (members.size === 1 || !voteStopEnabled) {
      player.destroy();

      const messages = await interaction.channel.messages.fetch({ limit: 10 });

      const stopMessage = messages.find(message =>
        message.author.bot && message.embeds && message.embeds.length > 0 &&
        message.embeds[0].description.startsWith(`:stop_button: | Stopped music playback and left the voice channel.`)
      );
  
      if (stopMessage) {
        try {
          await stopMessage.delete();
        } catch (error) {
          logger.error(`Failed to delete message: ${error}.`);
        }
      }
    
      const stopEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:stop_button: | Stopped music playback and left the voice channel.\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)

        .setTimestamp();
    
      return interaction.reply({ embeds: [stopEmbed] });
    }

    const votesRequired = Math.ceil(members.size * 0.6);
    const votes = {};
    let votingEnded = false;

    const stopRequestEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:warning: | <@${interaction.user.id}> requested to </stop:1190439304405733390> the music playback.\n\nTotal votes required: \`${votesRequired}\`\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)
      .setTimestamp();
    
    const message = await interaction.reply({ embeds: [stopRequestEmbed], fetchReply: true });
    
    let timeRemaining = 20;
    
    const updateCountdown = () => {
      timeRemaining--;
      if (timeRemaining > 0) {
        stopRequestEmbed.setDescription(`:warning: | <@${interaction.user.id}> requested to </stop:1190439304405733390> the music playback.\n\nTotal votes required: \`${votesRequired}\`\nTime remaining: \`${timeRemaining}s\`\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)
        message.edit({ embeds: [stopRequestEmbed] });
      } else {
        clearInterval(countdownInterval); 
      }
    };
    
    const countdownInterval = setInterval(updateCountdown, 1000);
  
    message.react('👍').then(() => message.react('👎'));

    const collectorFilter = (reaction, user) => {
      return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
    };

    const collector = message.createReactionCollector({ filter: collectorFilter, time: 20000 });

    collector.on('collect', (reaction, user) => {
      votes[reaction.emoji.name] = (votes[reaction.emoji.name] || 0) + 1;
      if (reaction.emoji.name === '👍') {
        if (votes['👎']) {
          votes['👎']--;
        }
        message.reactions.resolve('👎').users.remove(user.id);
      } else if (reaction.emoji.name === '👎') {
        if (votes['👍']) {
          votes['👍']--;
        }
        message.reactions.resolve('👍').users.remove(user.id);
      }
    });
    
    collector.on('end', async () => {
      if (votingEnded) return;
    
      votingEnded = true;
    
      const thumbsUpCount = votes['👍'] || 0;
      if (thumbsUpCount >= votesRequired) {
        player.destroy();

        const messages = await interaction.channel.messages.fetch({ limit: 10 });

        const stopMessage = messages.find(message =>
          message.author.bot && message.embeds && message.embeds.length > 0 &&
          message.embeds[0].description === `:stop_button: | Stopped music playback and left the voice channel.\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`
        );
    
        if (stopMessage) {
          try {
            await stopMessage.delete();
          } catch (error) {
            logger.error(`Failed to delete message: ${error}.`);
          }
        }
    
        const stopEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:stop_button: | Stopped music playback and left the voice channel.\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)
          .setTimestamp();
    
        interaction.editReply({ embeds: [stopEmbed] });
      } else {
        const notEnoughVotesEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | Not enough votes to </stop:1190439304405733390> the music playback.\n\n</votestop:1190439304405733393>: ${voteStopEnabled ? `\`ON\`` : `\`OFF\``}.`)
    
        interaction.editReply({ embeds: [notEnoughVotesEmbed] });
      }
    
      await message.reactions.removeAll();
    });
  },
};