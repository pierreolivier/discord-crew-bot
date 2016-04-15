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
var api = require('./bot.api');
var feature = require('./bot.features');
var configuration = require('../configuration');

var client;

exports.client = function () {
    return client;
};

exports.run = function() {
    client = new Discordie();

    feature.loadDisrespect();

    client.connect({
        token: configuration.discord.token
    });

    client.Dispatcher.on("GATEWAY_READY", function(e) {
        log("Connected as: " + client.User.username);

        api.joinVoiceChannel('102400143973711872', 'La plèbe');
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
        var channelId = '169431334756810753';
        if (e.message.author.id != client.User.id && e.message.channel_id == channelId) {
            // msg from a specific channel
        }

        if (e.message.author.id != client.User.id) {
            var meme = configuration.bot.meme;
            for (var i in meme) {
                var command = meme[i];

                if (e.message.content.indexOf(command.name) == 0) {
                    var message = e.message.content.substr(command.name.length + 1).replace(/\s+/g, ' ');

                    if (command.handleText != undefined) {
                        message = command.handleText(message);
                    }

                    log('Meme (' + e.message.author.username + '): ' + e.message.content);

                    sendImage(e, message, command.image, command.textColor, command.x, command.y);

                    e.message.delete();

                    break;
                }
            }

            var commands = configuration.bot.commands;
            for (var i in commands) {
                var command = commands[i];

                if (containsCommand(e.message.content, command.name)) {
                    var message = e.message.content.substr(command.name.length + 1);
                    var response = '';

                    if (command.handle != undefined) {
                        response = command.handle(message);
                    }

                    log('Command (' + e.message.author.username + '): ' + e.message.content);

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
        // uncomment to play on join
        feature.tts('Moussa', 'Bonjour !');
    });

    client.Dispatcher.on("VOICE_CHANNEL_JOIN", function(user, channel, channelId, guildId) {
        if (client.VoiceConnections[0] != undefined) {
            console.log(user.channel.id);
            console.log(client.VoiceConnections[0]);
            if (client.VoiceConnections[0].channelId == channelId) {
                //console.log(channelId);
            }
        }
    });
};

exports.stop = function() {
    client.disconnect();
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

exports.commands = function() {
    var meme = configuration.bot.meme;
    var commands = configuration.bot.commands;
    var list = "";

    for (var i in meme) {
        var command = meme[i];

        list += command.name + "\n";
    }

    list += "\n";

    for (var i in commands) {
        var command = commands[i];

        list += command.name + "\n";
    }

    return list;
};
