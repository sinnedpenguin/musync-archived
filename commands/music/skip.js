const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteSkipEnabled } = require('../../lib/votingManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song.'),

  async execute(interaction) {
    const voteSkipEnabled = getVoteSkipEnabled();
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to skip the song!')
        .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to skip the song!')
        .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song playing to skip!')
        .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })

      return interaction.reply({ embeds: [noSongEmbed], ephemeral: true });
    }

    if (player.queue.length > 0) {
      const members = voiceChannel.members.filter(m => !m.user.bot);

      if (members.size === 1 || !voteSkipEnabled) {
        player.stop();

        const skipEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':fast_forward: | Skipped to the next song.')
          .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })
          .setTimestamp();

        return interaction.reply({ embeds: [skipEmbed] }).then(msg => {
          setTimeout(() => msg.delete(), 5000);
        });
      }

      const votesRequired = Math.ceil(members.size * 0.6);
      const votes = {};
      let votingEnded = false;

      const skipRequestEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:warning: | <@${interaction.user.id}> requested to skip the current song.\n\nTotal votes required: \`${votesRequired}\``)
        .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })
        .setTimestamp();

      const message = await interaction.reply({ embeds: [skipRequestEmbed], fetchReply: true });

      let timeRemaining = 10;

      const updateCountdown = () => {
        timeRemaining--;
        if (timeRemaining > 0) {
          skipRequestEmbed.setDescription(`:warning: | <@${interaction.user.id}> requested to skip the current song.\n\nTotal votes required: \`${votesRequired}\`\nTime remaining: \`${timeRemaining}s\``);
          message.edit({ embeds: [skipRequestEmbed] });
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
          player.stop();

          const skipEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(':fast_forward: | Skipped to the next song.')
            .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })
            .setTimestamp();

          interaction.editReply({ embeds: [skipEmbed] }).then(msg => {
            setTimeout(() => msg.delete(), 5000);
          });
        } else {
          const notEnoughVotesEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(':x: | Not enough votes to skip the current song.')
            .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })

          interaction.editReply({ embeds: [notEnoughVotesEmbed] });
        }

        await message.reactions.removeAll();
      });
    } else {
      const noMoreSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There are no more songs to skip to.')
        .setFooter({ text: `/voteskip: ${voteSkipEnabled ? 'ON' : 'OFF'}` })

      interaction.reply({ embeds: [noMoreSongsEmbed], ephemeral: true });
    }
  },
};
