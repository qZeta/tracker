require('dotenv').config();
require('./functions.js');
const fs = require('fs');
const { join } = require('path');
const { Client, Collection, IntentsBitField, GatewayIntentBits, Events } = require('discord.js');

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

client.commands = new Collection();

const foldersPath = join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for(const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        if('data' in command && 'execute' in command)
            client.commands.set(command.data.name, command);
        else
            console.log(`The command at ${filePath} is missing necessary properties`);
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand())
        return;
    
    const command = interaction.client.commands.get(interaction.commandName);
    if(!command) {
        console.error(`/${interaction.commandName} was not found`);
        return;
    }

    try { await command.execute(interaction); }
    catch(error) {
        console.error(error);
        if(interaction.replied || interaction.deferred)
            await interaction.followUp({ content: 'Command could not be executed' });
        else
            await interaction.reply({ content: 'Command could not be executed' });
    }

    console.log(`${interaction.user.tag} used the command /${interaction.commandName} in the ${interaction.guild} server`);
});

client.login(process.env.TOKEN);