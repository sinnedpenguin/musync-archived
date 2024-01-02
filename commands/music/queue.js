const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const formatDuration = require('format-duration');
const config = require('../../config.json');
const logger = require('../../utils/logger');

const pageSize = 14;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current queue. Paginate. Leave blank for page 1.')
    .addNumberOption(option => option
      .setName('page')
      .setDescription('Page number of the queue. Leave blank for page 1.')
      .setMinValue(1)),

  async execute(interaction) {
    let player = interaction.client.manager.players.get(interaction.guild.id);

    if (!player || !player.queue || !player.queue.current) {
      const noSongsEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(':x: | No songs are currently playing! Use </play:1190439304183414879> to add songs!');

      return interaction.reply({
        embeds: [noSongsEmbed],
        ephemeral: true,
      });
    }

    const messages = await interaction.channel.messages.fetch({ limit: config.deleteLimit });
    
    const queueMessage = messages.find(message => 
      message.author.bot && 
      message.embeds.length > 0 && 
      message.embeds[0].title && 
      message.embeds[0].title.startsWith('Queue')
    );
  
    if (queueMessage) {
      try {
        await queueMessage.delete();
      } catch (error) {
        logger.error(`Failed to delete message: ${error}.`);
      }
    }

    const totalPages = Math.max(1, Math.ceil(player.queue.length / pageSize));
    let page = interaction.options.getNumber('page') || 1;

    page = Math.max(1, Math.min(page, totalPages));

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, player.queue.length);

    const queueString = player.queue.slice(startIndex, endIndex).map((track, index) => {
      const title = track.title.length > 30 ? `${track.title.slice(0, 30)}...` : track.title; 
      return `${startIndex + index + 1}. ${title} - \`${formatDuration(track.duration)}\` - <@${track.requester}>`;
    }).join('\n');

    const nowPlaying = player.queue.current;

    await interaction.deferReply();

    const queueEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`Queue (${player.queue.length + 1})`)
      .addFields(
        { name: 'Now Playing', value: nowPlaying ? `${nowPlaying.title} - **\`${formatDuration(nowPlaying.duration)}\`** - <@${nowPlaying.requester}>` : 'None' }
      );

    const totalDuration = player.queue.reduce((acc, track) => acc + track.duration, 0) + (nowPlaying ? nowPlaying.duration : 0);
    const formattedTotalDuration = formatDuration(totalDuration);
      
    if (player.queue.length >= 1) { 
      queueEmbed.addFields(
        { name: 'Upcoming', value: `${queueString}` },
        { name: 'Total Duration', value: `**\`${formattedTotalDuration}\`**`, inline: true },
        { name: 'Queue Repeat', value: `**\`${player.queueRepeat ? 'ON' : 'OFF'}\`**`, inline: true },
        { name: 'Shuffled?', value: `**\`${player.queue.isShuffled ? 'YES' : 'NO'}\`**`, inline: true }
      );
    }

    queueEmbed.setFooter({ text: `Page ${page} of ${totalPages}` });

    interaction.followUp({ embeds: [queueEmbed] });
  }
};
