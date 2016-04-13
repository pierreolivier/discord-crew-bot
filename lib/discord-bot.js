/**
 * Created by pierreolivier on 12/04/16.
 */
var configuration = require('../configuration');
var Discordie = require("discordie");
var fs = require('fs');
var util = require('util');
var gm = require('gm');

var disrespectDatabase = [];

function shorten(str, length) {
    if (str.length >= length) {
        var trimmedString = str.substr(0, length);
        var index = trimmedString.lastIndexOf(" ");

        return [trimmedString.substr(0, Math.min(trimmedString.length, index)), str.substr(index + 1, str.length)];
    } else {
        return [str, ''];
    }
}

function sendImage(e, message, image, color, x, y) {
    var imageWidth = '480';
    var charWidth = '27';

    var lines = shorten(message, 18);
    var lineWidth = Math.max(lines[0].length, lines[1].length) * charWidth;

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
            var commands = configuration.bot.meme;

            for (var i in commands) {
                var command = commands[i];

                if (e.message.content.indexOf(command.name) != -1) {
                    var message = e.message.content.substr(command.name.length + 1);

                    if (command.handleText != undefined) {
                        message = command.handleText(message);
                    }

                    sendImage(e, message, command.image, command.textColor, command.x, command.y);

                    break;
                }
            }

            if (e.message.content.indexOf("/bot") != -1 || e.message.content.indexOf("/help") != -1) {
                var commands = configuration.bot.meme;
                var message = "";

                for (var i in commands) {
                    var command = commands[i];

                    message += command.name + " ";
                }

                e.message.channel.sendMessage(message);
            }
        } else {

        }
    });
};
