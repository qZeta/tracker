require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const { join } = require('path');

var List;
var Client;

class player {
    constructor(id) {
        this.id = id;
    }
    ign;
    daily;
    weekly;
    monthly;
    yearly;
}

saveToJSON = (player) => {
    const strings = [JSON.stringify(player.daily), JSON.stringify(player.weekly), JSON.stringify(player.monthly), JSON.stringify(player.yearly)];

    if(!fs.existsSync(join(__dirname, 'archive', player.id)))
        fs.mkdirSync(join(__dirname, 'archive', player.id));
    fs.writeFileSync(join(__dirname, 'archive', player.id, 'daily.json'), strings[0]);
    fs.writeFileSync(join(__dirname, 'archive', player.id, 'weekly.json'), strings[1]);
    fs.writeFileSync(join(__dirname, 'archive', player.id, 'monthly.json'), strings[2]);
    fs.writeFileSync(join(__dirname, 'archive', player.id, 'yearly.json'), strings[3]);
}

registerPlayers = async () => {
    const zeta = new player('30e5ed124c6640ddaa540e65f395fd9f');
    const jill = new player('83d79c89b7184baba6876764671f4aab');
    const mol = new player('40deca8a49a941428ac96315bb15e3f2');
    const michael = new player('87c9e49d4f044b53a0bbf392f1482670');
    const vaef = new player('247e05fe9df247a2bccd6b0e1d031d42');
    const tuba = new player('5d14eff18ff149668eec5bd0ff500140');
    const ghost = new player('8fdb994ee60f483f89edb55da192b7ed');

    List = [zeta, jill, mol, michael, vaef, tuba, ghost];

    for(const player of List) {
        if(!fs.existsSync(join(__dirname, 'archive', player.id, 'daily.json'))) {
            const now = await getBWStats(player.id);
            player.daily = now;
            player.weekly = now;
            player.monthly = now;
            player.yearly = now;
            saveToJSON(player);
            continue;
        }
        player.daily = JSON.parse(fs.readFileSync(join(__dirname, 'archive', player.id, 'daily.json')));
        player.weekly = JSON.parse(fs.readFileSync(join(__dirname, 'archive', player.id, 'weekly.json')));
        player.monthly = JSON.parse(fs.readFileSync(join(__dirname, 'archive', player.id, 'monthly.json')));
        player.yearly = JSON.parse(fs.readFileSync(join(__dirname, 'archive', player.id, 'yearly.json')));
    }

    return List;
}

track = async (list, client) => {
    Client = client;
    const refresh = 5;
    const time = new Date();

    const min = time.getMinutes();
    const hr = time.getHours();
    const day = time.getDay();
    const date = time.getDate();
    const mon = time.getMonth();

    if(hr === 0 && min <= 5) {
        await client.channels.cache.get(process.env.RESET).send(`Resetting daily stats... ${time}`);
        for(const player of list)
            player.daily = await getBWStats(player.id);

        if(day === 0) {
            await client.channels.cache.get(process.env.RESET).send(`Resetting weekly stats... ${time}`);
            for(const player of list)
                player.weekly = player.daily;

            if(date === 0) {
                await client.channels.cache.get(process.env.RESET).send(`Resetting monthly stats... ${time}`);
                for(const player of list)
                    player.monthly = player.daily;

                if(mon === 0) {
                    await client.channels.cache.get(process.env.RESET).send(`Resetting yearly stats... ${time}`);
                    for(const player of list)
                        player.yearly = player.daily;
                }
            }
        }
        for(const player of list)
            saveToJSON(player);
    }

    if(min % refresh === 0) {
        await client.channels.cache.get(process.env.REFRESH).send(`Refreshing display... ${time}`);
        await deleteOld(client);
        await display(list, client);
    }

    setTimeout(track, 1000*60, list, client);
}

getIGN = async (id) => {
    const promise = await fetch(process.env.HYP_API + process.env.HYP_KEY + '&uuid=' + id);
    const response = await promise.json();
    
    if(response.success)
        return response.player.displayname;

    return response.success;
}

getBWStats = async (id) => {
    const promise = await fetch(process.env.HYP_API + process.env.HYP_KEY + '&uuid=' + id);
    const response = await promise.json();
    
    if(response.success)
        return response.player.stats.Bedwars;

    return response.success;
}

getWS = async (ign) => {
    const promise = await fetch(process.env.WS_API + process.env.AS_KEY + '&player=' + ign);
    const response = await promise.json();
    if(response.success === false)
        return [false, false, false, false, false];
    return [response.overall_winstreak, response.eight_one_winstreak, response.eight_two_winstreak, response.four_three_winstreak, response.four_four_winstreak];
}

deleteOld = async (client) => {
    const dailymsg = await client.channels.cache.get(process.env.DAILY).send('deleting...');
    const dailyfetched = await dailymsg.channel.messages.fetch({ limit: 99 });
    dailymsg.channel.bulkDelete(dailyfetched);
    const weeklymsg = await client.channels.cache.get(process.env.WEEKLY).send('deleting...');
    const weeklyfetched = await weeklymsg.channel.messages.fetch({ limit: 99 });
    weeklymsg.channel.bulkDelete(weeklyfetched);
    const monthlymsg = await client.channels.cache.get(process.env.MONTHLY).send('deleting...');
    const monthlyfetched = await monthlymsg.channel.messages.fetch({ limit: 99 });
    monthlymsg.channel.bulkDelete(monthlyfetched);
    const yearlymsg = await client.channels.cache.get(process.env.YEARLY).send('deleting...');
    const yearlyfetched = await yearlymsg.channel.messages.fetch({ limit: 99 });
    yearlymsg.channel.bulkDelete(yearlyfetched);
    const wsmsg = await client.channels.cache.get(process.env.WS).send('deleting...');
    const wsfetched = await wsmsg.channel.messages.fetch({ limit: 99 });
    wsmsg.channel.bulkDelete(wsfetched);
}

display = async (list, client) => {
    for(const player of list) {
        player.ign = await getIGN(player.id);
        const now = await getBWStats(player.id);
        const dailymsg = await client.channels.cache.get(process.env.DAILY).send(list.indexOf(player).toString());
        const dailyfk = now.final_kills_bedwars - player.daily.final_kills_bedwars;
        const dailyfd = now.final_deaths_bedwars - player.daily.final_deaths_bedwars;
        const dailywin = now.wins_bedwars - player.daily.wins_bedwars;
        const dailyloss = now.losses_bedwars - player.daily.losses_bedwars;
        const dailykill = now.kills_bedwars - player.daily.kills_bedwars;
        const dailydeath = now.deaths_bedwars - player.daily.deaths_bedwars;
        const dailybb = now.beds_broken_bedwars - player.daily.beds_broken_bedwars;
        const dailybl = now.beds_lost_bedwars - player.daily.beds_lost_bedwars;
        const dailyxp = now.Experience - player.daily.Experience;
        const dfkdrgain = ratio(now.final_kills_bedwars, now.final_deaths_bedwars) - ratio(player.daily.final_kills_bedwars, player.daily.final_deaths_bedwars);
        const dwlrgain = ratio(now.wins_bedwars, now.losses_bedwars) - ratio(player.daily.wins_bedwars, player.daily.losses_bedwars);
        const dkdrgain = ratio(now.kills_bedwars, now.deaths_bedwars) - ratio(player.daily.kills_bedwars, player.daily.deaths_bedwars);
        const dbblrgain = ratio(now.beds_broken_bedwars, now.beds_lost_bedwars) - ratio(player.daily.beds_broken_bedwars, player.daily.beds_lost_bedwars);
        dailymsg.edit(`**${player.ign}:**  \`+${xpToStar(dailyxp)}✫\`
        \`${dailyfk} FK, ${dailyfd} FD, ${round(ratio(dailyfk, dailyfd), 2)} FKDR (${sign(round(dfkdrgain, 4))})\`
        \`${dailywin} W,  ${dailyloss} L,  ${round(ratio(dailywin, dailyloss), 2)} WLR  (${sign(round(dwlrgain, 4))})\`
        \`${dailykill} K,  ${dailydeath} D,  ${round(ratio(dailykill, dailydeath), 2)} KDR  (${sign(round(dkdrgain, 4))})\`
        \`${dailybb} BB, ${dailybl} BL, ${round(ratio(dailybb, dailybl), 2)} BBLR (${sign(round(dbblrgain, 4))})\``);

        const weeklymsg = await client.channels.cache.get(process.env.WEEKLY).send(list.indexOf(player).toString());
        const weeklyfk = now.final_kills_bedwars - player.weekly.final_kills_bedwars;
        const weeklyfd = now.final_deaths_bedwars - player.weekly.final_deaths_bedwars;
        const weeklywin = now.wins_bedwars - player.weekly.wins_bedwars;
        const weeklyloss = now.losses_bedwars - player.weekly.losses_bedwars;
        const weeklykill = now.kills_bedwars - player.weekly.kills_bedwars;
        const weeklydeath = now.deaths_bedwars - player.weekly.deaths_bedwars;
        const weeklybb = now.beds_broken_bedwars - player.weekly.beds_broken_bedwars;
        const weeklybl = now.beds_lost_bedwars - player.weekly.beds_lost_bedwars;
        const weeklyxp = now.Experience - player.weekly.Experience;
        const wfkdrgain = ratio(now.final_kills_bedwars, now.final_deaths_bedwars) - ratio(player.weekly.final_kills_bedwars, player.weekly.final_deaths_bedwars);
        const wwlrgain = ratio(now.wins_bedwars, now.losses_bedwars) - ratio(player.weekly.wins_bedwars, player.weekly.losses_bedwars);
        const wkdrgain = ratio(now.kills_bedwars, now.deaths_bedwars) - ratio(player.weekly.kills_bedwars, player.weekly.deaths_bedwars);
        const wbblrgain = ratio(now.beds_broken_bedwars, now.beds_lost_bedwars) - ratio(player.weekly.beds_broken_bedwars, player.weekly.beds_lost_bedwars);
        weeklymsg.edit(`**${player.ign}:**  \`+${xpToStar(weeklyxp)}✫\`
        \`${weeklyfk} FK, ${weeklyfd} FD, ${round(ratio(weeklyfk, weeklyfd), 2)} FKDR (${sign(round(wfkdrgain, 4))})\`
        \`${weeklywin} W,  ${weeklyloss} L,  ${round(ratio(weeklywin, weeklyloss), 2)} WLR  (${sign(round(wwlrgain, 4))})\`
        \`${weeklykill} K,  ${weeklydeath} D,  ${round(ratio(weeklykill, weeklydeath), 2)} KDR  (${sign(round(wkdrgain, 4))})\`
        \`${weeklybb} BB, ${weeklybl} BL, ${round(ratio(weeklybb, weeklybl), 2)} BBLR (${sign(round(wbblrgain, 4))})\``);

        const monthlymsg = await client.channels.cache.get(process.env.MONTHLY).send(list.indexOf(player).toString());
        const monthlyfk = now.final_kills_bedwars - player.monthly.final_kills_bedwars;
        const monthlyfd = now.final_deaths_bedwars - player.monthly.final_deaths_bedwars;
        const monthlywin = now.wins_bedwars - player.monthly.wins_bedwars;
        const monthlyloss = now.losses_bedwars - player.monthly.losses_bedwars;
        const monthlykill = now.kills_bedwars - player.monthly.kills_bedwars;
        const monthlydeath = now.deaths_bedwars - player.monthly.deaths_bedwars;
        const monthlybb = now.beds_broken_bedwars - player.monthly.beds_broken_bedwars;
        const monthlybl = now.beds_lost_bedwars - player.monthly.beds_lost_bedwars;
        const monthlyxp = now.Experience - player.monthly.Experience;
        const mfkdrgain = ratio(now.final_kills_bedwars, now.final_deaths_bedwars) - ratio(player.monthly.final_kills_bedwars, player.monthly.final_deaths_bedwars);
        const mwlrgain = ratio(now.wins_bedwars, now.losses_bedwars) - ratio(player.monthly.wins_bedwars, player.monthly.losses_bedwars);
        const mkdrgain = ratio(now.kills_bedwars, now.deaths_bedwars) - ratio(player.monthly.kills_bedwars, player.monthly.deaths_bedwars);
        const mbblrgain = ratio(now.beds_broken_bedwars, now.beds_lost_bedwars) - ratio(player.monthly.beds_broken_bedwars, player.monthly.beds_lost_bedwars);
        monthlymsg.edit(`**${player.ign}:**  \`+${xpToStar(monthlyxp)}✫\`
        \`${monthlyfk} FK, ${monthlyfd} FD, ${round(ratio(monthlyfk, monthlyfd), 2)} FKDR (${sign(round(mfkdrgain, 4))})\`
        \`${monthlywin} W,  ${monthlyloss} L,  ${round(ratio(monthlywin, monthlyloss), 2)} WLR  (${sign(round(mwlrgain, 4))})\`
        \`${monthlykill} K,  ${monthlydeath} D,  ${round(ratio(monthlykill, monthlydeath), 2)} KDR  (${sign(round(mkdrgain, 4))})\`
        \`${monthlybb} BB, ${monthlybl} BL, ${round(ratio(monthlybb, monthlybl), 2)} BBLR (${sign(round(mbblrgain, 4))})\``);

        const yearlymsg = await client.channels.cache.get(process.env.YEARLY).send(list.indexOf(player).toString());
        const yearlyfk = now.final_kills_bedwars - player.yearly.final_kills_bedwars;
        const yearlyfd = now.final_deaths_bedwars - player.yearly.final_deaths_bedwars;
        const yearlywin = now.wins_bedwars - player.yearly.wins_bedwars;
        const yearlyloss = now.losses_bedwars - player.yearly.losses_bedwars;
        const yearlykill = now.kills_bedwars - player.yearly.kills_bedwars;
        const yearlydeath = now.deaths_bedwars - player.yearly.deaths_bedwars;
        const yearlybb = now.beds_broken_bedwars - player.yearly.beds_broken_bedwars;
        const yearlybl = now.beds_lost_bedwars - player.yearly.beds_lost_bedwars;
        const yearlyxp = now.Experience - player.yearly.Experience;
        const yfkdrgain = ratio(now.final_kills_bedwars, now.final_deaths_bedwars) - ratio(player.yearly.final_kills_bedwars, player.yearly.final_deaths_bedwars);
        const ywlrgain = ratio(now.wins_bedwars, now.losses_bedwars) - ratio(player.yearly.wins_bedwars, player.yearly.losses_bedwars);
        const ykdrgain = ratio(now.kills_bedwars, now.deaths_bedwars) - ratio(player.yearly.kills_bedwars, player.yearly.deaths_bedwars);
        const ybblrgain = ratio(now.beds_broken_bedwars, now.beds_lost_bedwars) - ratio(player.yearly.beds_broken_bedwars, player.yearly.beds_lost_bedwars);
        yearlymsg.edit(`**${player.ign}:**  \`+${xpToStar(yearlyxp)}✫\`
        \`${yearlyfk} FK, ${yearlyfd} FD, ${round(ratio(yearlyfk, yearlyfd), 2)} FKDR (${sign(round(yfkdrgain, 4))})\`
        \`${yearlywin} W,  ${yearlyloss} L,  ${round(ratio(yearlywin, yearlyloss), 2)} WLR  (${sign(round(ywlrgain, 4))})\`
        \`${yearlykill} K,  ${yearlydeath} D,  ${round(ratio(yearlykill, yearlydeath), 2)} KDR  (${sign(round(ykdrgain, 4))})\`
        \`${yearlybb} BB, ${yearlybl} BL, ${round(ratio(yearlybb, yearlybl), 2)} BBLR (${sign(round(ybblrgain, 4))})\``);

        const wsmsg = await client.channels.cache.get(process.env.WS).send(list.indexOf(player).toString());
        const ws = await getWS(player.ign);
        wsmsg.edit(`**${player.ign}:**
        \`Overall - ${ws[0]}, Solo - ${ws[1]}, Doubles - ${ws[2]}, Threes - ${ws[3]}, Fours - ${ws[4]}\``);
    }

    const time = new Date();
    await client.channels.cache.get(process.env.DAILY).send(`Last updated <t:${Math.floor(time.getTime() / 1000)}:R>`);
    await client.channels.cache.get(process.env.WEEKLY).send(`Last updated <t:${Math.floor(time.getTime() / 1000)}:R>`);
    await client.channels.cache.get(process.env.MONTHLY).send(`Last updated <t:${Math.floor(time.getTime() / 1000)}:R>`);
    await client.channels.cache.get(process.env.YEARLY).send(`Last updated <t:${Math.floor(time.getTime() / 1000)}:R>`);
    await client.channels.cache.get(process.env.WS).send(`Last updated <t:${Math.floor(time.getTime() / 1000)}:R>`);
}

xpToStar = (xp) => {
    return round((xp / 487000) * 100, 2);
}

round = (num, places) => {
    if(Number.isInteger(num))
        return num;
    const mult = Math.pow(10, places);
    return (Math.round(num * mult) / mult).toFixed(places);
}

ratio = (num1, num2) => {
    return !num2 ? num1 : num1 / num2;
}

sign = (num) => {
    return num >= 0 ? '+' + num.toString() : num.toString();
}

getList = () => {
    return List;
}

getClient = () => {
    return Client;
}

module.exports = {
    registerPlayers,
    track,
    getList,
    getClient
}