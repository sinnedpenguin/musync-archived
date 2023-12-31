const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkTopGGVoteAndRespond  } = require('../../utils/topgg');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter-soft')
    .setDescription('Toggle Soft filter.'),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const commandName = interaction.commandName;

    if (!await checkTopGGVoteAndRespond(interaction, commandName)) {
      return;
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongPlayingEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song currently playing! Use </play:1190439304183414879> to play a song!')

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
  
      return interaction.followUp({ 
        embeds: [sameVoiceChannelEmbed], 
        ephemeral: true 
      });
    }

    const messages = await interaction.channel.messages.fetch({ limit: 3 });

    const filterMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].description && 
      message.embeds[0].description.includes('filter')
    );

    if (filterMessage) {
      await filterMessage.delete();
    }

    // eslint-disable-next-line no-undef
    player.toggleLowPass(smoothing = 20);

    await interaction.deferReply();

    const filterEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:white_check_mark: | \`Soft\` filter is now ${player.filters.karaoke ? '`enabled`' : '`disabled`'}! Use </nowplaying:1190439304183414877> to see all enabled filters.`)
      .setTimestamp();

    interaction.followUp({
      embeds: [filterEmbed],
    });
  },
};
