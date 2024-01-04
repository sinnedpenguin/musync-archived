const { Events, ActivityType } = require('discord.js');
const client = require('../client');
const { AutoPoster } = require('topgg-autoposter');
const logger = require('../utils/logger');
const express = require('express'); 

const app = express(); 
const port = 3000;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute() {
    client.manager.init(client.user.id);
    logger.info(`${client.user.tag} logged in.`);

    const poster = AutoPoster(process.env.TOPGG_TOKEN, client);

    poster.on('posted', (stats) => {
      logger.info(`Posted stats to Top.gg | ${stats.serverCount} servers.`);
    });

    let totalUsers = 0;

    client.guilds.cache.forEach((guild) => {
      totalUsers += guild.memberCount;
    });

    let activities = [
      { type: ActivityType.Playing, name: "music ♩ ♪ ♫" },
      { type: ActivityType.Watching, name: () => `${client.guilds.cache.size.toLocaleString()} servers.` },
      { type: ActivityType.Custom, name: () => `Listening with ${totalUsers.toLocaleString()} users.` },
    ];
    let i = 0;

    setInterval(() => {
      let activity = activities[i++ % activities.length];
      client.user.setActivity({
        type: activity.type,
        name: typeof activity.name === 'function' ? activity.name() : activity.name
      });
    }, 60 * 1000); 

    app.get('/musyncServerCount', (req, res) => {
      res.send({ serverCount: client.guilds.cache.size });
    });

    app.listen(port, () => {
      logger.info(`Server is listening at http://localhost:${port}`);
    });
	},
};