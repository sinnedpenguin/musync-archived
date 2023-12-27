const { Events, ActivityType } = require('discord.js');
const client = require('../lib/client');
const { AutoPoster } = require('topgg-autoposter');
const logger = require('../lib/logger');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute() {
    client.manager.init(client.user.id);
    logger.info(`${client.user.tag} is now online.`);

    /* const poster = AutoPoster(process.env.TOPGG_TOKEN, client);

    poster.on('posted', (stats) => {
      logger.log(`Posted stats to Top.gg | ${stats.serverCount} servers.`);
    }); */

    client.user.setActivity({
      type: ActivityType.Playing,
      name: "music ♩ ♪ ♫"
    });
	},
};