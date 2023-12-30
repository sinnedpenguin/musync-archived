const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteStopEnabled, setVoteStopEnabled } = require('../../lib/votingManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('votestop')
    .setDescription('Toggle the voting system for stopping music playback.'),

  async execute(interaction) {
    const voteStopEnabled = getVoteStopEnabled(); 
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to toggle the voting system for stopping the music playback!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    setVoteStopEnabled(!voteStopEnabled);

    const toggleEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | Voting system for stopping music playback is now ${!voteStopEnabled ? '`ON`' : '`OFF`'}.`)
      .setTimestamp();

    interaction.reply({ embeds: [toggleEmbed] });
  },
};