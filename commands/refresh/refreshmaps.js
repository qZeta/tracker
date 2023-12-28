require('dotenv').config();
require('../../functions.js');
const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refreshmaps')
        .setDescription('refresh maps display'),

    async execute(interaction) {
        await interaction.deferReply();
        const client = getClient();
        const time = new Date();

        await displayMaps(client);

        await client.channels.cache.get(process.env.REFRESH).send(`${interaction.user.tag} manually refreshed the map display at ${time}`);
    }       
}