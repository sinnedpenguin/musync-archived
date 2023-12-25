const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const package = require('../../package.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available commands and bot info.'),

  execute(interaction) {
    const commands = interaction.client.commands
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map(command => `\`${command.data.name}\``)
      .join(', ');

    const helpEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Commands')
      .setDescription(`${commands}`)
      .addFields(
        { name: ' ', value: ' ' },
        { name: `Musync! v${package.version}`, value: `:copyright: [sinnedpenguin](${config.developer})` },
        { name: ' ', value: `✨[Website](${config.website}) | [Support Server](${config.supportServer}) | [Vote](${config.vote}) | [Donate/Sponsor](${config.donate})` }
      );

    interaction.reply({ embeds: [helpEmbed] });
  }
};
