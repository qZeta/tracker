require('dotenv').config();
require('../../functions.js');
const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('refresh display'),

    async execute(interaction) {
        await interaction.deferReply();
        const list = getList();
        const client = getClient();
        const time = new Date();

        await deleteOld(client);
        await display(list, client);

        await client.channels.cache.get(process.env.REFRESH).send(`${interaction.user.tag} manually refreshed the display at ${time}`);
    }       
}