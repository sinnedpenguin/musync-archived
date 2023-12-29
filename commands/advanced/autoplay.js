const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../../lib/topgg');
const config = require('../../config.json');
const logger = require('../../lib/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay. Automatically adds and plays similar songs to the queue.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    logger.info(`"${userId}" executed "${commandName}".`);

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

    if (!interaction.member.voice.channel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to toggle Autoplay!');

      return interaction.followUp({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    };

    let player = interaction.client.manager.players.get(interaction.guild.id);

    player.set('requester', interaction.user.id);
    player.set('autoplay', !player.get('autoplay'));

    logger.info(`User: "${userId}" successfully toggled "${commandName}".`);

    const autoPlayEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | \`Autoplay\` is now \`${player.get('autoplay') ? 'ON' : 'OFF'}\`! Use \`/nowplaying\` to see the current status.`)
      .setTimestamp();

    return interaction.followUp({
      embeds: [autoPlayEmbed],
    });
  }
};
