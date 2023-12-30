const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../../lib/topgg');
const config = require('../../config.json');
const logger = require('../../lib/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-8d')
    .setDescription('Toggle 8D filter.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    const hasVoted = await checkTopGGVote(userId);

    await interaction.deferReply();

    /* if (!hasVoted) {
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
    } */

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

    // eslint-disable-next-line no-undef
    player.toggleRotating(rotationHz = 0.2);

    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | \`8D\` filter is now ${player.filters.rotating ? '`enabled`' : '`disabled`'}! Use </nowplaying:1190439304183414877> to see all enabled filters.`)
      .setTimestamp();

    interaction.followUp({
      embeds: [filterEmbed],
    });
  },
};
