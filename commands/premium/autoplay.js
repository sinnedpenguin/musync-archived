const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const logFilePath = path.join(__dirname, '../../logs.txt');

function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`, 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay. '),
  async execute(interaction) {
    await interaction.deferReply();

    if (!interaction.member.voice.channel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to toggle Autoplay!');

      return interaction.followUp({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    let player = interaction.client.manager.players.get(interaction.guild.id);

    player.set('requester', interaction.user.id);
    player.set('autoplay', !player.get('autoplay'));

    const autoPlayEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(player.get(`autoplay`) ? ':white_check_mark: | **Autoplay**: `ON`.' : ':white_check_mark: | **Autoplay** `OFF`.')
      .setTimestamp();

    return interaction.followUp({
      embeds: [autoPlayEmbed],
    });
  }
};
