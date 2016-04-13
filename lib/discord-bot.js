/**
 * Created by pierreolivier on 12/04/16.
 */
var configuration = require('../configuration');
var Discordie = require("discordie");
var fs = require('fs');
var gm = require('gm');

function chunk(str, n) {
    var ret = [];
    var i;
    var len;

    for(i = 0, len = str.length; i < len; i += n) {
        ret.push(str.substr(i, n))
    }

    return ret
}

function sendImage(e, message, image, color, x, y) {
    message = chunk(message, 18).join("\n");

    gm(image)
        .stroke("#000000")
        .fill(color)
        .font("assets/impact-opt.ttf", 50)
        .drawText(x, y, message)
        .write(image + ".2.png", function (err) {
            e.message.channel.uploadFile(image + ".2.png");
        });
}

exports.run = function() {
    var client = new Discordie();

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
                    sendImage(e, e.message.content.substr(command.name.length + 1), command.image, command.textColor, command.x, command.y);

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
