/**
 * Created by pierreolivier on 12/04/16.
 */
var fs = require('fs');
var util = require('util');
var log = require('util').log;
var lame = require('lame');
var request = require('request');

var Discordie = require("discordie");
var utils = require('./utils');
var Api = require('./bot.api');
var Features = require('./bot.features');
var disrespect = require('./bot.disrespect');
var configuration = require('../configuration');

/**
 * Bots
 * @type {Array} Array of bots
 */
var bots = [];

/**
 * Return the bots array
 * @returns {Array} Bots array
 */
exports.bots = function () {
    return bots;
};

/**
 * Run bots
 */
exports.run = function() {
    // Load disrespect database
    disrespect.loadDisrespect();

    // For each bots
    configuration.bots.forEach(function (info) {
        // Discord api
        const client = new Discordie();
        
        // Bot object
        const bot = {
            client: client, // Discord api
            configuration: info, // Bot configuration
            voiceNumber: 0 // Number of voice clients (updated only if info.onNotifyVoice exists)
        };

        log('Starting ' + info.token + '...');

        client.connect({
            token: info.token
        });

        client.Dispatcher.on("GATEWAY_READY", function(e) {
            log("Connected as: " + client.User.username);

            // Init bot
            bot.id = client.User.id;
            bot.api = new Api(bot);
            bot.features = new Features(bot);
            if (info.onNotifyVoice != undefined) {
                bot.voiceNumber = getVoiceUserNumber(bot.client);
            }

            // Init event
            if (info.init != undefined) {
                info.init(bot);
            }
        });

        client.Dispatcher.on("MESSAGE_CREATE", function(e) {
            var content = e.message.content;

            // Check if the message contains a bot name
            var usernameInMessage = getBotUsername(e.message.content);
            if (usernameInMessage != '' && usernameInMessage != client.User.username) {
                // Yes but the message is not for this bot
                return;
            } else if (usernameInMessage == client.User.username) {
                // Yes and the message is for this bot
                var messageLowerCase = e.message.content.toLowerCase();
                var usernameLowerCase = client.User.username.toLowerCase();
                var index = messageLowerCase.indexOf(usernameLowerCase);

                // Removing the name of the bot from the message
                content = e.message.content.substr(0, index - 1) + e.message.content.substr(index + usernameLowerCase.length, messageLowerCase.length);
            }

            // For each message that don't come from the bot
            if (!isBot(e.message.author.id)) {
                // Parse meme
                var meme = info.meme;
                for (var i in meme) {
                    var command = meme[i];

                    // Filter functions
                    var compare = function () { return true };
                    var deny = function() {};
                    if (info.filter != undefined && info.filter.meme != undefined) {
                        if (info.filter.meme.compare != undefined) {
                            compare = info.filter.meme.compare;
                        }
                        if (info.filter.meme.deny != undefined) {
                            deny = info.filter.meme.deny;
                        }
                    }

                    if (content.indexOf(command.name) == 0) {
                        if (compare(bot, e)) {
                            // Remove the command from the message
                            var message = content.substr(command.name.length + 1).replace(/\s+/g, ' ');

                            // Handle text event, can modify the original message
                            if (command.handleText != undefined) {
                                message = command.handleText(bot, message);
                            }

                            log('Meme (' + e.message.author.username + '): ' + content);

                            // Send the image
                            bot.features.meme(e, message, command.image, command.textColor, command.x, command.y);
                        } else {
                            deny(bot, e);
                        }

                        // Delete the original message
                        e.message.delete();

                        break;
                    }
                }

                // Parse commands
                var commands = info.commands;
                for (var i in commands) {
                    var command = commands[i];

                    if (containsCommand(content, command.name)) {
                        var message = content.substr(command.name.length + 1);
                        var response = '';

                        // Handle command
                        if (command.handle != undefined) {
                            response = command.handle(bot, message, e);
                        }

                        log('Command (' + e.message.author.username + '): ' + content);

                        // Send a response
                        if (response != '') {
                            e.message.channel.sendMessage(response);
                        }

                        // Remove the original message if removeMessage == true
                        if (command.removeMessage != undefined && command.removeMessage == true) {
                            e.message.delete();
                        }

                        break;
                    }
                }
            } else {

            }
        });

        client.Dispatcher.on("VOICE_CONNECTED", function(e) {
            // Voice connected event
            if (info.voiceConnected != undefined) {
                info.voiceConnected(bot);
            }
        });

        client.Dispatcher.on("VOICE_CHANNEL_JOIN", function(user, channel, channelId, guildId) {
            // On new voice user event, when an user join the channel
            if (info.onNewVoiceUser != undefined && client.VoiceConnections.length > 0 && user.channel.id == client.VoiceConnections[0].voiceConnection.channelId && !isBot(user.user.id)) {
                info.onNewVoiceUser(bot, user.user.username);
            }

            // On notify voice event, when an user join a voice channel (only the first one)
            if (info.onNotifyVoice != undefined) {
                if (bot.voiceNumber == 0 && info.onNotifyVoice != undefined && !isBot(user.user.id)) {
                    info.onNotifyVoice(bot, user.channel.name, user.user.username);
                }
                bot.voiceNumber = getVoiceUserNumber(bot.client);
            }
        });

        client.Dispatcher.on("VOICE_CHANNEL_LEAVE", function(user, channel, channelId, guildId, newChannelId, newGuildId) {
            if (info.onLeaveVoiceUser != undefined && client.VoiceConnections.length > 0 && user.channel.id == client.VoiceConnections[0].voiceConnection.channelId && !isBot(user.user.id)) {
                info.onLeaveVoiceUser(bot, user.user.username);
            }

            if (info.onNotifyVoice != undefined) {
                bot.voiceNumber = getVoiceUserNumber(bot.client);
            }

            if (info.onNoVoiceUser != undefined && bot.voiceNumber == 0) {
                info.onNoVoiceUser(bot);
            }
        });

        client.Dispatcher.on("PRESENCE_UPDATE", function(guild) {
            // On user connected event, when a user is back online
            if (guild.member.status == 'online') {
                if (info.onUserConnected != undefined) {
                    info.onUserConnected(bot, guild.member);
                }
            }
        });

        bots.push(bot);
    });
};

/**
 * Stop bots
 */
exports.stop = function() {
    bots.forEach(function(bot) {
        bot.client.disconnect();
    });
};

/**
 * Return true if the message contains the command name
 * @param message Message
 * @param commands Array of commands or String
 * @returns {boolean}
 */
function containsCommand(message, commands) {
    if (typeof commands == 'object') {
        for (var i in commands) {
            if (message.indexOf(commands[i]) == 0) {
                return true;
            }
        }
    } else {
        return message.indexOf(commands) == 0;
    }

    return false;
}

/**
 * Return a username bot if it's in a message
 * @param message Message
 * @returns {*} Bot's username
 */
function getBotUsername(message) {
    var username = '';

    message = message.toLowerCase();

    for (var i in bots) {
        if (message.indexOf(bots[i].client.User.username.toLowerCase()) > 1) {
            return bots[i].client.User.username;
        }
    }

    return username;
}

/**
 * Return true if the user id is a bot
 * @param id User id
 * @returns {boolean}
 */
function isBot(id) {
    var result = false;

    bots.forEach(function(bot) {
        if (bot.id == id) {
            result = true;
        }
    });

    return result;
}

/**
 * Return the number of bots of a channel
 * @param voiceChannel Voice channel
 * @returns {number}
 */
function getBotNumber(voiceChannel) {
    var number = 0;

    voiceChannel.members.forEach(function(member) {
        if (isBot(member.id)) {
            number++;
        }
    });

    return number;
}

/**
 * Return the number of real members (without bots) in a voice channel
 * @param client Discord client
 * @returns {number}
 */
function getVoiceUserNumber(client) {
    var number = 0;

    client.Guilds.forEach(function(guild) {
        guild.voiceChannels.forEach(function(channel) {
            number += channel.members.length - getBotNumber(channel);
        });
    });

    return number;
}
