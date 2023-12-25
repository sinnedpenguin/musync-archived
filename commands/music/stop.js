const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteStopEnabled } = require('../../lib/votingManager'); 

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
        .setDescription(':x: | You need to be in a voice channel to stop the music playback!')
        .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to stop the music playback!')
        .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no music playback to stop!')
        .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })

      return interaction.reply({ embeds: [noSongEmbed], ephemeral: true });
    }

    const members = voiceChannel.members.filter(m => !m.user.bot);

    if (members.size === 1 || !voteStopEnabled) {
      player.destroy();
    
      const stopEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':stop_button: | Stopped music playback and left the voice channel.')
        .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })
        .setTimestamp();
    
      return interaction.reply({ embeds: [stopEmbed] });
    }

    const votesRequired = Math.ceil(members.size * 0.6);
    const votes = {};
    let votingEnded = false;

    const stopRequestEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:warning: | <@${interaction.user.id}> requested to stop the music playback.\n\nTotal votes required: \`${votesRequired}\``)
      .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })
      .setTimestamp();
    
    const message = await interaction.reply({ embeds: [stopRequestEmbed], fetchReply: true });
    
    let timeRemaining = 10;
    
    const updateCountdown = () => {
      timeRemaining--;
      if (timeRemaining > 0) {
        stopRequestEmbed.setDescription(`:warning: | <@${interaction.user.id}> requested to stop the music playback.\n\nTotal votes required: \`${votesRequired}\`\nTime remaining: \`${timeRemaining}s\``);
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

    const collector = message.createReactionCollector({ filter: collectorFilter, time: 10000 });

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
    
        const stopEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':stop_button: | Stopped music playback and left the voice channel.')
          .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })
          .setTimestamp();
    
        interaction.editReply({ embeds: [stopEmbed] });
      } else {
        const notEnoughVotesEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':x: | Not enough votes to stop the music playback.')
          .setFooter({ text: `/votestop: ${voteStopEnabled ? 'ON' : 'OFF'}` })
    
        interaction.editReply({ embeds: [notEnoughVotesEmbed] });
      }
    
      await message.reactions.removeAll();
    });
  },
};