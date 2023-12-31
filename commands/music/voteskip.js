const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getVoteSkipEnabled, setVoteSkipEnabled } = require('../../utils/votingManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voteskip')
    .setDescription('Toggle the voting system for skipping songs.'),

  async execute(interaction) {
    const voteSkipEnabled = getVoteSkipEnabled(); 
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to toggle the voting system for skipping songs!')

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    setVoteSkipEnabled(!voteSkipEnabled);

    await interaction.deferReply();

    const toggleEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | Voting system for skipping songs is now ${!voteSkipEnabled ? '`ON`' : '`OFF`'}.`)
      .setTimestamp();

    interaction.followUp({ embeds: [toggleEmbed] });
  },
};
