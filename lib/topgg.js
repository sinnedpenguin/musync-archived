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

module.exports = checkTopGGVote;