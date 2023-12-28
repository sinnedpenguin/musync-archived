const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const package = require('../../package.json');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available commands and bot info.'),

  execute(interaction) {
    const categories = {
      'General': '',
      'Music': '',
      'Filters': '',
      'Advanced': '',
    };

    const commandFolders = fs.readdirSync(path.join(__dirname, '..', '..', 'commands'));
    for (const folder of commandFolders) {
      let category = folder.charAt(0).toUpperCase() + folder.slice(1);
      category = (category === 'Utility') ? 'General' : category;

      const commandFiles = fs.readdirSync(path.join(__dirname, '..', '..', 'commands', folder)).filter(file => file.endsWith('.js'));
      categories[category] = commandFiles.map(file => `\`${file.slice(0, -3)}\``).join(', ');
    }

    const helpEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Commands');

    for (const [category, commands] of Object.entries(categories)) {
      helpEmbed.addFields({ name: category, value: commands });
    }

    helpEmbed.addFields(
      { name: ' ', value: ' ' },
      { name: `Musync! v${package.version}`, value: `:copyright: [sinnedpenguin](${config.developer})` },
      { name: ' ', value: `✨[Website](${config.website}) | [Support Server](${config.supportServer}) | [Vote](${config.vote}) | [Donate/Sponsor](${config.donate})` }
    );
    
    interaction.reply({ embeds: [helpEmbed] });
  }
};
