/**
 * Created by pierreolivier on 12/04/16.
 */
var fs = require('fs');
var util = require('util');
var gm = require('gm');
var utils = require('./utils');
var log = require('util').log;
var lame = require('lame');
var request = require('request');

var Discordie = require("discordie");
var Api = require('./bot.api');
var Features = require('./bot.features');
var disrespect = require('./bot.disrespect');
var configuration = require('../configuration');

var bots = [];

exports.client = function () {
    return client;
};

exports.run = function() {
    disrespect.loadDisrespect();

    //for (i = 0; i < configuration.bots.length; i++) {
    configuration.bots.forEach(function (info, i) {
        //const index = i;
        const client = new Discordie();
        //const info = configuration.bots[index];
        const bot = {
            client: client,
            configuration: info
        };
        bot.api = new Api(bot);
        bot.features = new Features(bot);

        log('Starting ' + info.token + '...');

        client.connect({
            token: info.token
        });

        client.Dispatcher.on("GATEWAY_READY", function(e) {
            log("Connected as: " + client.User.username);

            if (info.init != undefined) {
                info.init(bot);
            }

            //bot.api.joinVoiceChannel('102400143973711872', 'La plèbe');
            /*const guild = client.Guilds.getBy('id', '102400143973711872');
             if (!guild) return log("Guild not found: " + '102400143973711872');

             var maxMembers = 0;
             var voiceChannel = guild.voiceChannels[0];
             for (var i in guild.voiceChannels) {
             var members = guild.voiceChannels[i].members;

             if (members.length > maxMembers) {
             maxMembers = members.length;
             voiceChannel = guild.voiceChannels[i];
             }
             }
             voiceChannel.join(false, false);*/
        });

        client.Dispatcher.on("MESSAGE_CREATE", function(e) {
            var content = e.message.content;
            var usernameInMessage = getUsername(e.message.content);
            if (usernameInMessage != '' && usernameInMessage != client.User.username) {
                return;
            } else if (usernameInMessage == client.User.username) {
                var messageLowerCase = e.message.content.toLowerCase();
                var usernameLowerCase = client.User.username.toLowerCase();
                var index = messageLowerCase.indexOf(usernameLowerCase);

                content = e.message.content.substr(0, index - 1) + e.message.content.substr(index + usernameLowerCase.length, messageLowerCase.length);
            }

            if (e.message.author.id != client.User.id) {
                var meme = info.meme;
                for (var i in meme) {
                    var command = meme[i];

                    if (content.indexOf(command.name) == 0) {
                        var message = content.substr(command.name.length + 1).replace(/\s+/g, ' ');

                        if (command.handleText != undefined) {
                            message = command.handleText(bot, message);
                        }

                        log('Meme (' + e.message.author.username + '): ' + content);

                        sendImage(e, message, command.image, command.textColor, command.x, command.y);

                        e.message.delete();

                        break;
                    }
                }

                var commands = info.commands;
                for (var i in commands) {
                    var command = commands[i];

                    if (containsCommand(content, command.name)) {
                        var message = content.substr(command.name.length + 1);
                        var response = '';

                        if (command.handle != undefined) {
                            response = command.handle(bot, message);
                        }

                        log('Command (' + e.message.author.username + '): ' + content);

                        if (response != '') {
                            e.message.channel.sendMessage(response);
                        }

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
            //bot.features.tts('Moussa', 'Bonjour !');
        });

        client.Dispatcher.on("VOICE_CHANNEL_JOIN", function(user, channel, channelId, guildId) {
            /*if (client.VoiceConnections[0] != undefined) {
                console.log(user.channel.id);
                console.log(client.VoiceConnections[0]);
                if (client.VoiceConnections[0].channelId == channelId) {
                    //console.log(channelId);
                }
            }*/
        });

        bots.push(bot);
    });
};

exports.stop = function() {
    for (var i in bots) {
        bots[i].client.disconnect();
    }
};

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

function getUsername(message) {
    var username = '';

    message = message.toLowerCase();

    for (var i in bots) {
        if (message.indexOf(bots[i].client.User.username.toLowerCase()) > 1) {
            return bots[i].client.User.username;
        }
    }

    return username;
}

function sendImage(e, message, image, color, x, y) {
    var imageWidth = '480';
    var charWidth = '27';

    var lines = utils.shorten(message, 18);
    var lineWidth = 0;
    for (var i in lines) {
        if (lines[i].length > lineWidth) {
            lineWidth = lines[i].length;
        }
    }
    lineWidth *= charWidth;

    message = lines.join("\n");

    x = imageWidth / 2 - lineWidth / 2 + 20;

    gm(image)
        .stroke("#000000")
        .fill(color)
        .font("assets/impact-opt.ttf", 50)
        .drawText(x, y, message, 'Centers')
        .write(image + ".2.png", function (err) {
            e.message.channel.uploadFile(image + ".2.png", null, e.message.author.username + ':');
        });
}
