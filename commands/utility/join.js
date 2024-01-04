const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the voice channel.'),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | You need to be in a voice channel to use this command! Please try again: ${config.commands.join}.`)

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const channelPermissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);

    if (!channelPermissions || !channelPermissions.has(PermissionsBitField.Flags.Connect)) {
      const noPermissionEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | No permission to join the voice channel! Please check permissions and try again: ${config.commands.join}.`);
    
      return interaction.reply({
        embeds: [noPermissionEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (sameVoiceChannel && voiceChannel.id === sameVoiceChannel.id) {
      const alreadyInChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | Already in the voice channel! Do you mean ${config.commands.leave}?`)
  
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
      const joinErrorEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:x: | Error joining to the voice channel. Please try again: ${config.commands.join}.`)
        .setTimestamp();

      interaction.reply({ embeds: [joinErrorEmbed] });
    }

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });

    const leaveMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].description && 
      message.embeds[0].description === `:wave: | Left the voice channel: \`${voiceChannel.name}\``
    );

    if (leaveMessage) {
      try {
        await leaveMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    const joinEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | Joined the voice channel: \`${voiceChannel.name}\`!`)
      .setTimestamp();

    interaction.reply({ embeds: [joinEmbed] });
  },
};