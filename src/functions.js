require('dotenv').config();
const fetch = require('node-fetch');

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

registerPlayers = async () => {
    const zeta = new player('30e5ed124c6640ddaa540e65f395fd9f');
    const jill = new player('83d79c89b7184baba6876764671f4aab');
    const mol = new player('40deca8a49a941428ac96315bb15e3f2');
    const michael = new player('87c9e49d4f044b53a0bbf392f1482670');
    const tuba = new player('5d14eff18ff149668eec5bd0ff500140');
    const ghost = new player('8fdb994ee60f483f89edb55da192b7ed');

    const list = [zeta, jill, mol, michael, tuba, ghost];

    for(const player of list) {
        const now = await getBWStats(player.id);
        player.daily = now;
        player.weekly = now;
        player.monthly = now;
        player.yearly = now;
    }

    return list;
}

track = async (list, client) => {
    const refresh = 10;
    const time = new Date();

    const min = time.getMinutes();
    const hr = time.getHours();
    const day = time.getDay();
    const date = time.getDate();
    const mon = time.getMonth();

    for(const player of list) {
        if(hr === 2) {
            console.log(`resetting daily... ${time}`)
            player.daily = await getBWStats(player.id);
            if(player.daily === false) {
                console.log(`Error getting stats for ${player.id}`);
                return;
            }
            if(day === 0) {
                console.log(`resetting weekly... ${time}`)
                player.weekly = await getBWStats(player.id);
                if(player.ign === false) {
                    console.log(`Error getting stats for ${player.id}`);
                    return;
                }
                if(date === 0) {
                    console.log(`resetting monthly... ${time}`)
                    player.monthly = await getBWStats(player.id);
                    if(player.ign === false) {
                        console.log(`Error getting stats for ${player.id}`);
                        return;
                    }
                    if(mon === 0) {
                        console.log(`resetting yearly... ${time}`)
                        player.yearly = await getBWStats(player.id);
                        if(player.ign === false) {
                            console.log(`Error getting stats for ${player.id}`);
                            return;
                        }
                    }
                }
            }
        }
    }

    if(min % refresh === 0) {
        console.log(`refreshing messages... ${time}`);
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
        return [false, false, false, false, false, false];
    return [response.overall_winstreak, response.eight_one_winstreak, response.eight_two_winstreak, response.four_three_winstreak, response.four_four_winstreak, response.two_four_winstreak];
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
        dailymsg.edit(`**${player.ign}:**  \`+ ${xpToStar(dailyxp)}✫\`
        \`${dailyfk} FK, ${dailyfd} FD, ${round(ratio(dailyfk, dailyfd), 2)} FKDR\`
        \`${dailywin} W,  ${dailyloss} L,  ${round(ratio(dailywin, dailyloss), 2)} WLR \`
        \`${dailykill} K,  ${dailydeath} D,  ${round(ratio(dailykill, dailydeath), 2)} KDR \`
        \`${dailybb} BB, ${dailybl} BL, ${round(ratio(dailybb, dailybl), 2)} BBLR\``);

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
        weeklymsg.edit(`**${player.ign}:**  \`+ ${xpToStar(weeklyxp)}✫\`
        \`${weeklyfk} FK, ${weeklyfd} FD, ${round(ratio(weeklyfk, weeklyfd), 2)} FKDR\`
        \`${weeklywin} W,  ${weeklyloss} L,  ${round(ratio(weeklywin, weeklyloss), 2)} WLR \`
        \`${weeklykill} K,  ${weeklydeath} D,  ${round(ratio(weeklykill, weeklydeath), 2)} KDR \`
        \`${weeklybb} BB, ${weeklybl} BL, ${round(ratio(weeklybb, weeklybl), 2)} BBLR\``);

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
        monthlymsg.edit(`**${player.ign}:**  \`+ ${xpToStar(monthlyxp)}✫\`
        \`${monthlyfk} FK, ${monthlyfd} FD, ${round(ratio(monthlyfk, monthlyfd), 2)} FKDR\`
        \`${monthlywin} W,  ${monthlyloss} L,  ${round(ratio(monthlywin, monthlyloss), 2)} WLR \`
        \`${monthlykill} K,  ${monthlydeath} D,  ${round(ratio(monthlykill, monthlydeath), 2)} KDR \`
        \`${monthlybb} BB, ${monthlybl} BL, ${round(ratio(monthlybb, monthlybl), 2)} BBLR\``);

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
        yearlymsg.edit(`**${player.ign}:**  \`+ ${xpToStar(yearlyxp)}✫\`
        \`${yearlyfk} FK, ${yearlyfd} FD, ${round(ratio(yearlyfk, yearlyfd), 2)} FKDR\`
        \`${yearlywin} W,  ${yearlyloss} L,  ${round(ratio(yearlywin, yearlyloss), 2)} WLR \`
        \`${yearlykill} K,  ${yearlydeath} D,  ${round(ratio(yearlykill, yearlydeath), 2)} KDR \`
        \`${yearlybb} BB, ${yearlybl} BL, ${round(ratio(yearlybb, yearlybl), 2)} BBLR\``);

        const wsmsg = await client.channels.cache.get(process.env.WS).send(list.indexOf(player).toString());
        const ws = await getWS(player.ign);
        wsmsg.edit(`**${player.ign}:**
        \`Overall - ${ws[0]}, Solo - ${ws[1]}, Doubles - ${ws[2]}, Threes - ${ws[3]}, Fours - ${ws[4]}, 4v4 - ${ws[5]}\``);
    }

    const time = new Date();
    await client.channels.cache.get(process.env.DAILY).send(`Next refresh <t:${Math.floor((time.getTime() / 1000) + (10*60))}:R>`);
    await client.channels.cache.get(process.env.WEEKLY).send(`Next refresh <t:${Math.floor((time.getTime() / 1000) + (10*60))}:R>`);
    await client.channels.cache.get(process.env.MONTHLY).send(`Next refresh <t:${Math.floor((time.getTime() / 1000) + (10*60))}:R>`);
    await client.channels.cache.get(process.env.YEARLY).send(`Next refresh <t:${Math.floor((time.getTime() / 1000) + (10*60))}:R>`);
    await client.channels.cache.get(process.env.WS).send(`Next refresh <t:${Math.floor((time.getTime() / 1000) + (10*60))}:R>`);
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
    if(num2 === 0)
        return num1;
    return num1 / num2;
}

module.exports = {
    player,
    registerPlayers,
    track
}