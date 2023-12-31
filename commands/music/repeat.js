const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repeat')
    .setDescription('Repeats the current song or queue.')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('The repeat mode')
        .setRequired(true)
        .addChoices(
          { name: 'song', value: 'song' },
          { name: 'queue', value: 'queue' },
          { name: 'off', value: 'off' },
        )),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      const voiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You need to be in a voice channel to repeat a song/queue!');

      return interaction.reply({
        embeds: [voiceChannelEmbed],
        ephemeral: true,
      });
    }

    const sameVoiceChannel = interaction.guild.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!sameVoiceChannel || voiceChannel.id !== sameVoiceChannel.id) {
      const sameVoiceChannelEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | You must be in the same voice channel to repeat a song/queue!');
  
      return interaction.reply({ embeds: [sameVoiceChannelEmbed], ephemeral: true });
    }

    const player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue.current) {
      const noSongQueueEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | There is no song/queue currently playing!');

      return interaction.reply({
        embeds: [noSongQueueEmbed],
        ephemeral: true,
      });
    }

    const mode = interaction.options.getString('mode');

    switch (mode) {
      case 'off': {
        player.setQueueRepeat(false);
        player.setTrackRepeat(false);
        break;
      }
    
      case 'song': {
        player.setQueueRepeat(false);
        player.setTrackRepeat(true);
        break;
      }
    
      case 'queue': {
        player.setTrackRepeat(false);
        player.setQueueRepeat(true);
        break;
      }
    
      default: {
        const invalidModeEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':x: | Invalid repeat mode.');
    
        return interaction.reply({
          embeds: [invalidModeEmbed],
          ephemeral: true,
        });
      }
    }

    const messages = await interaction.channel.messages.fetch({ limit: 10 });

    const oldRepeatModeMessage = messages.find(message =>
      message.author.bot && message.embeds && message.embeds.length > 0 &&
      (message.embeds[0].description.startsWith(':repeat: | `Song` repeat') ||
       message.embeds[0].description.startsWith(':repeat: | `Queue` repeat'))
    );
    
    if (oldRepeatModeMessage) {
      try {
        await oldRepeatModeMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }
    
    let newRepeatModeMessage;
    
    if (player.trackRepeat) {
      newRepeatModeMessage = `:repeat: | \`Song\` repeat: ${player.trackRepeat ? '`ON`' : '`OFF`'}. Use </nowplaying:1190439304183414877> to see the current status.`;
    } else {
      newRepeatModeMessage = `:repeat: | \`Queue\` repeat: ${player.queueRepeat ? '`ON`' : '`OFF`'}. Use </queue:1190439304183414881> to see the current status.`;
    } 

    await interaction.deferReply();
    
    const repeatModeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`${newRepeatModeMessage}`)
      .setTimestamp();
    
    interaction.followUp({
      embeds: [repeatModeEmbed],
    });
  },
};