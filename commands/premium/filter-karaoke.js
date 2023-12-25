const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../../lib/topgg')
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-karaoke')
    .setDescription('Toggle Karaoke filter.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    /* if (!userId) {
      const responseEmbed = new EmbedBuilder()
        .setDescription(`:x: | Unable to identify user.`);

      console.error("User ID is undefined");
      await interaction.reply({
        embeds: [responseEmbed],
        ephemeral: true,
      });
      return;
    }

    const hasVoted = await checkTopGGVote(userId);

    if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:unlock: | Unlock the \`${commandName}\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`filters\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
        })
      
      await interaction.reply({
        embeds: [responseEmbed],
      });
      return;
    } */

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to toggle \`${commandName}\`!`);

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing!')

      return interaction.reply({
        embeds: [noSongPlayingEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to toggle \`${commandName}\`!`);
  
      return interaction.reply({ 
        embeds: [sameVoiceChannelEmbed], 
        ephemeral: true 
      });
    }

    player.toggleKaraoke(level = 1, monoLevel = 1, filterBand = 220, filterWidth = 100);

    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | **Filter - Karaoke**: \`${player.filters.karaoke ? 'ON' : 'OFF'}\`.`)
      .setTimestamp();

    interaction.reply({
      embeds: [filterEmbed],
    });
  },
};
