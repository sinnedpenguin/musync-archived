require('dotenv').config();
require('./utils/eventsHandler');
require('./utils/commandsHandler');
require('./deployCommands')
const client = require('./lib/client');

client.login(process.env.BOT_TOKEN);