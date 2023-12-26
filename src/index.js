require('dotenv').config();
require('./functions.js');
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds
    ]
});

client.on('ready', async client => {
    console.log('online');
    const list = await registerPlayers();
    await track(list, client);
});

client.login(process.env.TOKEN);