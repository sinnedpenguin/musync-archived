const { Events, ActivityType } = require('discord.js');
const client = require('../lib/client');
const { AutoPoster } = require('topgg-autoposter');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute() {
    client.manager.init(client.user.id);
    console.log(`${client.user.tag} is ready to play music!`);

    /* const poster = AutoPoster(process.env.TOPGG_TOKEN, client);

    poster.on('posted', (stats) => {
      console.log(`Posted stats to Top.gg | ${stats.serverCount} servers.`);
    }); */

    client.user.setActivity({
      type: ActivityType.Playing,
      name: "music ♩ ♪ ♫"
    });
	},
};