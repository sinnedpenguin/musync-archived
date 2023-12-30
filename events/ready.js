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

    let activities = [
      { type: ActivityType.Playing, name: "music ♩ ♪ ♫" },
      { type: ActivityType.Watching, name: () => `${client.guilds.cache.size} servers.` },
      { type: ActivityType.Custom, name: () => `Listening with ${client.users.cache.size} users.` },
    ];
    let i = 0;

    setInterval(() => {
      let activity = activities[i++ % activities.length];
      client.user.setActivity({
        type: activity.type,
        name: typeof activity.name === 'function' ? activity.name() : activity.name
      });
    }, 60 * 1000); 
	},
};