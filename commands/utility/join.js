const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the voice channel.'),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to use this command!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (sameVoiceChannel && voiceChannel.id === sameVoiceChannel.id) {
      const alreadyInChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | Already in the voice channel!')
  
      return interaction.reply({ embeds: [alreadyInChannelEmbed], ephemeral: true });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    if (player && (player.queue.current || player.queue.length > 0)) {
      const currentVoiceChannel = interaction.guild.channels.cache.get(player.voiceChannel);
      const joinErrorEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | Cannot switch voice channels while playing music in \`${currentVoiceChannel.name}\`!`);

      return interaction.reply({ embeds: [joinErrorEmbed], ephemeral: true });
    }

    if (!player) {
      player = interaction.client.manager.create({
        guild: interaction.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: interaction.channel.id,
        selfDeafen: true,
      });
    } else {
      player.setVoiceChannel(voiceChannel.id); 
    }

    try {
      await player.connect();
    } catch (error) {
      console.error(error);
      return interaction.reply('Error joining to the voice channel.');
    }

    const joinEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | Joined the voice channel: \`${voiceChannel.name}\`!`)
      .setTimestamp();

    interaction.reply({ embeds: [joinEmbed] });
  },
};