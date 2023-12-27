const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-8d')
    .setDescription('Toggle 8D filter.'),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    await interaction.deferReply();

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

    player.toggleRotating(rotationHz = 0.2);

    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | **Filter - 8D**: \`${player.filters.rotating ? 'ON' : 'OFF'}\`.`)
      .setTimestamp();

    interaction.followUp({
      embeds: [filterEmbed],
    });
  },
};