require('dotenv').config();
require('./lib/eventsHandler');
require('./lib/commandsHandler');
require('./deployCommands')
const client = require('./lib/client');

client.login(process.env.BOT_TOKEN);