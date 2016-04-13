/**
 * Created by pierreolivier on 12/04/16.
 */
var configuration = require('../configuration');
var Discordie = require("discordie");
var fs = require('fs');
var util = require('util');
var gm = require('gm');
var utils = require('./utils');

var disrespectDatabase = [];

exports.run = function() {
    var client = new Discordie();

    exports.loadDisrespect();

    client.connect({
        token: configuration.discord.token
    });

    client.Dispatcher.on("GATEWAY_READY", function(e) {
        console.log("Connected as: " + client.User.username);
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
                    var message = e.message.content.substr(command.name.length + 1);

                    if (command.handleText != undefined) {
                        message = command.handleText(message);
                    }

                    sendImage(e, message, command.image, command.textColor, command.x, command.y);

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

                    e.message.channel.sendMessage(response);

                    break;
                }
            }
        } else {

        }
    });
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
            e.message.channel.uploadFile(image + ".2.png");
        });
}

exports.loadDisrespect = function() {
    if (fs.existsSync('assets/disrespect.json')) {
        try {
            disrespectDatabase = JSON.parse(fs.readFileSync('assets/disrespect.json').toString());
        } catch (e) {
            console.error("Can't parse assets/disrespect.json");
        }
    }
};

exports.saveDisrespect = function() {
    fs.writeFileSync('assets/disrespect.json', JSON.stringify(disrespectDatabase) , 'utf-8');
};

exports.addAndGetDisrespect = function(text) {
    if (disrespectDatabase.indexOf(text) == -1) {
        disrespectDatabase.push(text);

        exports.saveDisrespect();
    }

    return disrespectDatabase[Math.floor(Math.random() * disrespectDatabase.length)];
};

exports.getDisrespectDatabase = function() {
    return disrespectDatabase;
};

exports.getCommands = function() {
    var meme = configuration.bot.meme;
    var commands = configuration.bot.commands;
    var list = "";

    for (var i in meme) {
        var command = meme[i];

        list += command.name + "\n";
    }

    for (var i in commands) {
        var command = commands[i];

        list += command.name + "\n";
    }

    return list;
};