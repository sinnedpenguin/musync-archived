const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { Manager } = require('erela.js');
const Deezer = require("better-erela.js-deezer");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

const nodes = [
  {
		identifier: 'Node 1',
    host: process.env.LAVALINK_HOST,
    port: parseInt(process.env.LAVALINK_PORT),
    password: process.env.LAVALINK_PASSWORD,
    secure: false,
    retryAmount: 5,
    retryDelay: 30e3,
    requestTimeout: 10e3,
    version: "v4",
    useVersionPath: true,
  }
];

client.manager = new Manager({
  nodes,
  position_update_interval: 150,
	plugins: [
		new Deezer(),
	],  
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
})

module.exports = client;