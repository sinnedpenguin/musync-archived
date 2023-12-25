require('dotenv').config();
require('./lib/handler');
require('./deployCommands')
const client = require('./lib/client');

client.login(process.env.BOT_TOKEN);