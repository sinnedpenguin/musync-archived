const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkTopGGVote = require('../../lib/topgg')
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust the volume of music playback.')
    .addIntegerOption(option => option
      .setName('level')
      .setDescription('Volume level (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    const commandName = interaction.commandName;
    const voiceChannel = member.voice.channel;
    const volumeLevel = interaction.options.getInteger('level');

    const hasVoted = await checkTopGGVote(userId);

    await interaction.deferReply();

    if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:unlock: | Unlock the \`${commandName}\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
        })
      
      await interaction.followUp({
        embeds: [responseEmbed],
      });
      return;
    }

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to adjust the volume of music playback!')

      return interaction.followUp({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to adjust the volume of music playback!');
  
      return interaction.followUp({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No songs are currently playing!');

      return interaction.followUp({ embeds: [noSongsEmbed], ephemeral: true });
    }

    player.setVolume(volumeLevel);
    
    const volumeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:sound: | Set volume to \`${volumeLevel}\`.`)
      .setTimestamp();

    interaction.followUp({ embeds: [volumeEmbed] });
  },
};
