const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteSkipEnabled } = require('../../utils/votingManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Skip to a specific song in the queue.')
    .addIntegerOption(option => option
      .setName('song')
      .setDescription('Song number to skip to.')
      .setRequired(true)
      .setMinValue(1)),

  async execute(interaction) {
    const voteSkipEnabled = getVoteSkipEnabled();
    const songNumber = interaction.options.getInteger('song');

    if (songNumber < 1) {
      const invalidNumberEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | Invalid song number. Please enter a valid song number.\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)

      return interaction.reply({ embeds: [invalidNumberEmbed], ephemeral: true });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | No songs are currently playing! Use ${config.commands.play} to play a song!`)

      return interaction.reply({ embeds: [noSongsEmbed], ephemeral: true });
    }

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to ${config.commands.skipto} a specific song!\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to ${config.commands.skipto} to a specific song!\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }
    
    const members = voiceChannel.members.filter(m => !m.user.bot);
    const targetIndex = songNumber - 1;
    const targetSong = player.queue[targetIndex];

    if (!voteSkipEnabled || members.size === 1) {
      player.queue = player.queue.slice(targetIndex);
      player.stop();

      const skipEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:fast_forward: | Skipped to ${songNumber}. [${targetSong.title}](${targetSong.uri}).\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
        .setTimestamp();

      return interaction.reply({ embeds: [skipEmbed] }).then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    if (songNumber > player.queue.length) {
      const maxQueueEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | There ${player.queue.length === 1 ? 'is' : 'are'} only ${player.queue.length} song${player.queue.length !== 1 ? 's' : ''} in the queue.\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)

      return interaction.reply({ embeds: [maxQueueEmbed], ephemeral: true });
    }

    const votesRequired = Math.ceil(members.size * 0.6);
    const votes = {};
    let votingEnded = false;

    const skipToRequestEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:warning: | <@${interaction.user.id}> requested to ${config.commands.skipto} song number ${songNumber}.\n\nTotal votes required: \`${votesRequired}\`\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
      .setTimestamp();

    const message = await interaction.reply({ embeds: [skipToRequestEmbed], fetchReply: true });

    let timeRemaining = 20;

    const updateCountdown = () => {
      timeRemaining--;
      if (timeRemaining > 0) {
        skipToRequestEmbed.setDescription(`:warning: | <@${interaction.user.id}> requested to ${config.commands.skipto} song number ${songNumber}.\n\nTotal votes required: \`${votesRequired}\`\nTime remaining: \`${timeRemaining}s\`\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
        message.edit({ embeds: [skipToRequestEmbed] });
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
        player.queue = player.queue.slice(targetIndex);
        player.stop();

        const skiptoEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:fast_forward: | Skipped to ${songNumber}. [${targetSong.title}](${targetSong.uri}).\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
          .setTimestamp();

        interaction.editReply({ embeds: [skiptoEmbed] }).then(msg => {
          setTimeout(() => msg.delete(), 5000);
        });
      } else {
        const notEnoughVotesEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | Not enough votes to ${config.commands.skipto} the specified song.\n\n${config.commands.voteskip}: ${voteSkipEnabled ? `\`ON\`` : `\`OFF\``}.`)
          
        interaction.editReply({ embeds: [notEnoughVotesEmbed] });
      }

      await message.reactions.removeAll();
    });
  },
};
