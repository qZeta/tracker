require('dotenv').config();
require('../../functions.js');
const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('reset stats')
        .addIntegerOption(option => option
            .setName('type')
            .setDescription('type of stats to reset')
            .setRequired(true)
            .addChoices(
                { name: 'daily', value: 0 },
                { name: 'weekly', value: 1 },
                { name: 'monthly', value: 2 },
                { name: 'yearly', value: 3 }
            )),

    async execute(interaction) {
        await interaction.deferReply();
        if(interaction.user.id != process.env.DEVID) {
            await interaction.editReply('You are lacking permissions to do this');
            return;
        }
        const type = interaction.options.get('type').value;
        const list = getList();
        const time = new Date();

        if(type >= 0) {
            for(const player of list)
                player.daily = await getBWStats(player.id);
        }
        if(type >= 1) {
            for(const player of list)
                player.weekly = player.daily;
        }
        if(type >= 2) {
            for(const player of list)
                player.weekly = player.daily;
        }
        if(type >= 3) {
            for(const player of list)
                player.yearly = player.daily;
        }
        for(const player of list)
            saveToJSON(player);

        await interaction.editReply(`Manually resetting stats... ${time}`);
    }       
}