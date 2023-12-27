const pino = require('pino');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs.log');

const transport = pino.transport({
  targets: [
    {
      level: 'trace',
      target: 'pino-pretty',
      options: {
        destination: logFilePath,
        colorize: false,
      },
    },
    {
      level: 'trace',
      target: 'pino-pretty',
    },
  ],
});

const logger = pino(transport);

module.exports = logger;