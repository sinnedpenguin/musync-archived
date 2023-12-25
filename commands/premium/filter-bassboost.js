const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../../lib/topgg');
const filterManager = require('../../lib/filterManager');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-bassboost')
    .setDescription('Toggle Bass Boost filter.'),
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
    
    interaction.reply({
      embeds: [filterEmbed],
    });
  }
};
