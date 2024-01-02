const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const logger = require('./logger'); 

const TOPGG_TOKEN = process.env.TOPGG_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

async function checkTopGGVote(userId) {
  const response = await fetch(
    `https://top.gg/api/bots/${CLIENT_ID}/check?userId=${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: TOPGG_TOKEN,
      },
    },
  );

  const data = await response.json();

  return data.voted === 1;
}

async function checkTopGGVoteAndRespond(interaction, commandName) {
  const userId = interaction.user.id;

  const hasVoted = await checkTopGGVote(userId);

  await interaction.deferReply();

  if (!hasVoted) {
    logger.error(`"${userId}" has not voted to use "${commandName}".`);
      
    const responseEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`:unlock: | Unlock the \`${commandName}\` feature by casting your vote on \`Top.gg\`! Your vote unlocks access for \`12 hours\`!`)
      .addFields({
        name: 'Why Vote?',
        value: `Voting supports the growth of \`Musync!\`. Your contribution is valuable, and as a token of our appreciation, enjoy exclusive access to premium features like \`autoplay\`, \`filters\`, \`lyrics\`, \`volume\`, \`100% default volume\`, and more—coming soon!\n\n✨ **[Vote now!](${config.vote})**`,
      });
      
    await interaction.followUp({
      embeds: [responseEmbed],
    });
    return false;
  }

  return true;
}

module.exports = {
  checkTopGGVote,
  checkTopGGVoteAndRespond,
};