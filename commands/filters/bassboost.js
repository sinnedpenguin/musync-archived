const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const filterManager = require('../../lib/filterManager');
const checkTopGGVote = require('../../lib/topgg');
const config = require('../../config.json');
const logger = require('../../lib/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-bassboost')
    .setDescription('Toggle Bass Boost filter.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    const hasVoted = await checkTopGGVote(userId);

    await interaction.deferReply();

    if (!hasVoted) {
      logger.error(`"${userId}" has not voted to use "${commandName}".`);
      
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:unlock: | Unlock the \`${commandName}\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`filters\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
        });
      
      await interaction.followUp({
        embeds: [responseEmbed],
      });
      return;
    };

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing!')

      return interaction.followUp({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to toggle \`${commandName}\`!`);

      return interaction.followUp({ 
        embeds: [sameVoiceChannelEmbed], 
        ephemeral: true 
      });
    }

    let bassBoost = filterManager.toggleBassBoost();

    if (bassBoost) {
      player.setEQ(
        equalizer = [
          { band: 0, gain: 0.2 },
          { band: 1, gain: 0.15 },
          { band: 2, gain: 0.1 },
          { band: 3, gain: 0.05 },
          { band: 4, gain: 0.0 },
          { band: 5, gain: -0.05 },
          { band: 6, gain: -0.1 },
          { band: 7, gain: -0.1 },
          { band: 8, gain: -0.1 },
          { band: 9, gain: -0.1 },
          { band: 10, gain: -0.1 },
          { band: 11, gain: -0.1 },
          { band: 12, gain: -0.1 },
          { band: 13, gain: -0.1 },
          { band: 14, gain: -0.1 },
        ]
      );
    } else {
      player.setEQ(
        equalizer = [
          { band: 0, gain: 0 },
          { band: 1, gain: 0 },
          { band: 2, gain: 0 },
          { band: 3, gain: 0 },
          { band: 4, gain: 0 },
          { band: 5, gain: 0 },
          { band: 6, gain: 0 },
          { band: 7, gain: 0 },
          { band: 8, gain: 0 },
          { band: 9, gain: 0 },
          { band: 10, gain: 0 },
          { band: 11, gain: 0 },
          { band: 12, gain: 0 },
          { band: 13, gain: 0 },
          { band: 14, gain: 0 },
        ]
      );
    }
    
    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | **Filter - Bass Boost**: \`${bassBoost ? 'ON' : 'OFF'}\`.`)
      .setTimestamp();
    
    interaction.followUp({
      embeds: [filterEmbed],
    });
  }
};
