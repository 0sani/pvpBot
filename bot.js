const fs = require('fs')
const Discord = require('discord.js')
const { SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER, SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants')
const { time } = require('console')
const { get } = require('http')
const client = new Discord.Client()
const token = JSON.parse(fs.readFileSync('./token.JSON')).token
let playerList = JSON.parse(fs.readFileSync('./players.json'))
const prefix = '.pvp'

// Creates the list of players and their pvp statuses
function getCurrentList() {
    var d = new Date();
    h = d.getHours();
    m = d.getMinutes();
    let currentList = "```Last updated: "+h+":"+m+"\nList of players";
    currentList = currentList + "\n| Name             | Pvp On/Off |\n-------------------|-------------"
    for (i=0; i<playerList.users.length;i++) {
        let user = playerList.users[i].minecraftName;
        let status = playerList.users[i].pvp;
        status = status.toString()
        let playerStat = "| "+user+" ".repeat(16-user.length)+ " | "+status+ " ".repeat(10-status.length)+" |";
        currentList = currentList+"\n"+playerStat;
    }
    currentList = currentList + "```"
    return currentList
}

var message = '';
var listId = '';

client.once('ready', async () => {
    var d = new Date();
    var currentList = getCurrentList();
    console.log('Bot started at '+d);
    startMessage = await client.channels.cache.get('725766986415603788').send(getCurrentList());
});


client.on('message', msg => {
    var messageContent= msg.content;

    // Gets the time of message (uses the weird millisecond one because I was tired of trying to use that other subtraction)
    var messageTime = new Date().getTime();

    // Checks that the message starts with the prefix and is not a bot
    if (!messageContent.startsWith(prefix) || msg.author.bot) return;

    
    // Help Message
    const helpMessage='```Command List:\nUse commands by doing .pvp [command]\n\ninit player="[minecraft username]" - add youself to the list of users\nlist - lists the current pvp statuses\ntoggle - changes pvp status (can also be done using .pvp on or .pvp off)```';

    // if the message includes help, it will display the help message
    if (messageContent.includes('help')) {
        msg.channel.send(helpMessage);

    } else if (messageContent.includes('init')) { // Adds the player to the list if not in the list
        // If message doesn't have the proper form, it tells the user to try again with correct format
        if (!messageContent.includes('player')) {
            msg.channel.send("Enter the command in the form .pvp init player=[Minecraft username] pvp=[true or false]")
        } else {
            // By default, it's assumed that player is not in list
            let playerInList = false;
            // gets the username and pvp status
            let username = messageContent.match(/player=(.*) /)[1];
            let pvp = messageContent.match(/pvp=(.*)/)[1];

            if (pvp == "true" || pvp == "True") {
                pvp = true;
            } else if (pvp == "false" || pvp == "False") {
                pvp = false;
            } else{
                msg.channel.send('Please enter either true or false')
            }

            // Checks if player is in list
            for (i=0; i<playerList.users.length; i++) {
                if (playerList.users[i].name == username[1]) {
                    playerInList = true;
                }
            }
            
            // Tells player they're already in the list
            if (playerInList) {
                msg.channel.send('You are already in the player list');
            } else {
                playerList.users.push({ // Adds to the JSON file
                    discordName: msg.author.username,
                    minecraftName: username,
                    pvp: pvp,
                    timeChanged: messageTime 
                })
                fs.writeFile('./players.json',JSON.stringify(playerList), function(err) { // Writes to ./players.json
                    if (err) {
                        return console.log(err);
                    }
                });            
                msg.channel.send('Added to player list');
            }
        }

    } else if (messageContent.includes('list')) { // Displays the list of users
        msg.channel.send(getCurrentList());

    } else if (messageContent.includes("toggle") || messageContent.includes("on") || messageContent.includes("off")) {
        let player = "";
        for (i=0; i<playerList.users.length; i++) {
            if (playerList.users[i].discordName == msg.author.username) {
                player = playerList.users[i];
                
            }
        }
        var timeDiff = messageTime-player.timeChanged;
        if (timeDiff < 8640) { // Make sure to change this back to 86400000
            msg.channel.send('You can only toggle once every 24 hours');
        } else {
            // Updates the time the player changed their status, and changes it accordingly
            player.timeChanged = messageTime;
            if (messageContent.includes("toggle")) {
                player.pvp = !player.pvp;
            } else if (messageContent.includes("on")) {
                player.pvp = true;
            } else {
                player.pvp = false;
            }

            fs.writeFile('./players.json',JSON.stringify(playerList), function(err) { // Writes to ./players.json
                if (err) {
                    return console.log(err);
                }
            });
            msg.channel.send('Toggling your pvp setting')
        }
    
    } else {
        // Sends the help message if no parameter is applied
        msg.channel.send(helpMessage);
    }

    // Edits the list
    if (messageContent.includes('init')||messageContent.includes('toggle')||messageContent.includes('on')||messageContent.includes('off')) {
        startMessage.edit(getCurrentList())
    }
    
});

client.login(token);
