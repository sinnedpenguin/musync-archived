const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Rlyrics } = require("rlyrics");
const rlyrics = new Rlyrics();
const { checkTopGGVoteAndRespond  } = require('../../utils/topgg');
const config = require('../../config.json');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get the lyrics of a song.')
    .addStringOption((option) =>
      option.setName('query').setDescription('(Title) (Artist). Ex. Circles Post Malone.')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const commandName = interaction.commandName;
    let query = interaction.options.getString('query');

    logger.info(`"${userId}" executed "${commandName}".`);

    if (!await checkTopGGVoteAndRespond(interaction, commandName)) {
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchResults = await rlyrics.search(encodedQuery);
    
      if (searchResults.length > 0) {
    
        const bestResult = searchResults[0];
        const detailedResult = await rlyrics.find(bestResult.url);
    
        const lyricsContent = detailedResult.lyrics || ':x: | Lyrics not available. Please try again: </lyrics:1190439303931772979>.';
    
        const chunks = lyricsContent.match(/[\s\S]{1,2000}/g) || [];
    
        for (let i = 0; i < chunks.length; i++) {
          const responseEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${detailedResult.name} - ${detailedResult.artist[0].name}`)
            .setDescription(`${chunks[i]}\n\n ©️ [Musixmatch](https://www.musixmatch.com/)`)
            .setFooter({
              text: chunks.length > 1 ? `${i + 1}/${chunks.length}` : null
            });
    
          await interaction.reply({
            embeds: [responseEmbed]
          });
        }
      } else {
        const notFoundEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | No results found for \`${query}\`. Please try again: ${config.commands.lyrics}.`)
          .setTimestamp();
    
        await interaction.reply({ 
          embeds: [notFoundEmbed],
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error(error);
    
      if (error.message.includes('Invalid query')) {
        const invalidQueryEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | Invalid query. Please provide a valid query. Try again: ${config.commands.lyrics}.`)
          .setTimestamp();
    
        await interaction.reply({ 
          embeds: [invalidQueryEmbed],
          ephemeral: true 
        });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | An error occurred while fetching lyrics. Please try again: ${config.commands.lyrics}.`)
          .setTimestamp();
    
        await interaction.reply({ 
          embeds: [errorEmbed],
          ephemeral: true 
        });
      }
    }
  }, 
     
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    const searchResults = await rlyrics.search(encodeURIComponent(focusedValue));
    const tracks = searchResults.slice(0, 5);

    const options = tracks.map(track => ({
      name: `${track.title} - ${track.artist}`,
      value: `${track.title} - ${track.artist}`,
    }));

    await interaction.respond(options);
  },
};
