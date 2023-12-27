const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Rlyrics } = require("rlyrics");
const rlyrics = new Rlyrics();
const checkTopGGVote = require('../../lib/topgg')
const config = require('../../config.json');

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

    const hasVoted = await checkTopGGVote(userId);

    await interaction.deferReply();

    if (!hasVoted) {
      const responseEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`:unlock: | Unlock the \`${commandName}\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`!`)
        .addFields({
          name: 'Why Vote?',
          value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`lyrics\`, \`volume\`, and more—coming soon!\n\n✨ [Vote now!](${config.vote})`,
        })
      
      await interaction.followUp({
        embeds: [responseEmbed],
      });
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchResults = await rlyrics.search(encodedQuery);
    
      if (searchResults.length > 0) {
    
        const bestResult = searchResults[0];
        const detailedResult = await rlyrics.find(bestResult.url);
    
        const lyricsContent = detailedResult.lyrics || ':x: | Lyrics not available.';
    
        const chunks = lyricsContent.match(/[\s\S]{1,2000}/g) || [];
    
        for (let i = 0; i < chunks.length; i++) {
          const responseEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${detailedResult.name} - ${detailedResult.artist[0].name}`)
            .setDescription(`${chunks[i]}\n\n ©️ [Musixmatch](https://www.musixmatch.com/)`)
            .setFooter({
              text: chunks.length > 1 ? `${i + 1}/${chunks.length}` : null
            });
    
          await interaction.followUp({
            embeds: [responseEmbed]
          });
        }
      } else {
        const notFoundEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`:x: | No results found for \`${query}\`.`)
          .setTimestamp();
    
        await interaction.followUp({ 
          embeds: [notFoundEmbed],
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error(error);
    
      if (error.message.includes('Invalid query')) {
        const invalidQueryEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':x: | Invalid query. Please provide a valid query.')
          .setTimestamp();
    
        await interaction.followUp({ 
          embeds: [invalidQueryEmbed],
          ephemeral: true 
        });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(':x: | An error occurred while fetching lyrics. Please try again.')
          .setTimestamp();
    
        await interaction.followUp({ 
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
