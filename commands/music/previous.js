const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Return to the previous song in the queue.'),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to go back to the ${config.commands.previous} song!`);

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You must be in the same voice channel to go back to the ${config.commands.previous} song!`);
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }
    
    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.previous) {
      const noPreviousEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | There is no ${config.commands.previous} song to go back to!`);

      return interaction.reply({ 
        embeds: [noPreviousEmbed], 
        ephemeral: true 
      });
    }

    const currentSong = player.queue.current;

    const previousSong = player.queue.previous;

    player.queue.unshift(previousSong);

    player.queue[1] = currentSong;

    player.stop();

    const previousEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:rewind: | Returned to the ${config.commands.previous} song.`);

    interaction.reply({ embeds: [previousEmbed] }).then(msg => {
      setTimeout(() => msg.delete(), 5000);
    });
  },
};
