const fs = require('node:fs');
const path = require('node:path');
const client = require('./client');
const logger = require('./logger');

const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

let loadedCommands = 0;

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      loadedCommands++;
    } else {
      logger.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

logger.info(`Successfully reloaded ${loadedCommands} commands.`);