require('dotenv').config();
const fs = require('fs');
const { join } = require('path');
const { REST, Routes} = require('discord.js');

const commands = [];
const foldersPath = join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for(const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);

        if('data' in command && 'execute' in command)
            commands.push(command.data.toJSON());
        else
            console.log(`The command at ${filePath} is missing necessary properties`);
    }
}

const rest = new REST().setToken(process.env.TOKEN);

register();
//unregister();

function register() {
    (async () => {
        try {
            console.log(`Registering ${commands.length} commands...`);

            const data = await rest.put(Routes.applicationCommands(process.env.BOTID), { body: commands });

            try { console.log(`${data.length} commands registered`); }
            catch(error) { console.log('0 commands registered'); }
        }
        catch(error) { console.error(error); }
    })();
}

function unregister() {
    console.log(`Unregistering ${commands.length} commands...`);

    rest.put(Routes.applicationCommands(process.env.BOTID), { body: [] });

    try { console.log('Successfully unregistered all commands'); }
    catch(error) { console.error(error); }
}