/**
 * Created by pierreolivier on 12/04/16.
 */
var configuration = require('../configuration');
var Discordie = require("discordie");
var fs = require('fs');
var util = require('util');
var gm = require('gm');
var utils = require('./utils');
var log = require('util').log;
var lame = require('lame');
var request = require('request');

var client;
var disrespectDatabase = [];

exports.run = function() {
    client = new Discordie();

    exports.loadDisrespect();

    client.connect({
        token: configuration.discord.token
    });

    client.Dispatcher.on("GATEWAY_READY", function(e) {
        log("Connected as: " + client.User.username);

        exports.joinVoiceChannel('102400143973711872', 'La plèbe');
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

    list += "\n";

    for (var i in commands) {
        var command = commands[i];

        list += command.name + "\n";
    }

    return list;
};

exports.joinVoiceChannel = function(server, channel) {
    const guild = client.Guilds.getBy("id", server);
    if (!guild) return log("Guild not found: " + server);

    const voice = guild.voiceChannels.find(function(c) { return c.name == channel});
    if (!voice) return log("Channel not found: " + channel);

    voice.join(false, false);
};

exports.leaveVoiceChannel = function() {
    client.Channels.filter(function(channel) { return channel.type == "voice" && channel.joined })
    .forEach(function(channel) { channel.leave() });
};

exports.stopVoice = function() {
    if (!client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = client.VoiceConnections[0];
    info.voiceConnection.getEncoder().kill();
};

exports.tts = function(voice, text) {
    if (!client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = client.VoiceConnections[0];

    var mp3decoder = new lame.Decoder();

    request(configuration.bot.tts + "voice=" + encodeURI(voice) + "&text=" + encodeURI(text)).pipe(mp3decoder);

    mp3decoder.on('format', function(pcmfmt) {
        // note: discordie encoder does resampling if rate != 48000
        var options = {
            frameDuration: 60,
            sampleRate: pcmfmt.sampleRate,
            channels: pcmfmt.channels,
            float: false
        };

        var encoderStream = info.voiceConnection.getEncoderStream(options);
        if (!encoderStream) {
            return console.log(
                "Unable to get encoder stream, connection is disposed"
            );
        }

        info.voiceConnection.getEncoder().setVolume(100);

        encoderStream.resetTimestamp();
        encoderStream.removeAllListeners("timestamp");
        //encoderStream.on("timestamp", time => console.log("Time " + time));

        mp3decoder.pipe(encoderStream);
        mp3decoder.once('end', function() {
            //play(info);
        });
    });
};

exports.youtube = function(search) {
    if (!client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    request('https://www.googleapis.com/youtube/v3/search?part=id&type=video&key=' + configuration.bot.google + '&q=' + encodeURI(search), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var id = json['items'][0]['id']['videoId'];

            request('http://www.youtubeinmp3.com/download/?video=https://www.youtube.com/watch?v=' + id, function (error, response, body) {
                var indexStart = body.indexOf("/download/get/");
                var indexEnd = body.indexOf("\">", indexStart);

                var url = body.substr(indexStart, indexEnd - indexStart);

                var info = client.VoiceConnections[0];

                var mp3decoder = new lame.Decoder();

                request('http://www.youtubeinmp3.com' + url).pipe(mp3decoder);

                mp3decoder.on('format', function(pcmfmt) {
                    // note: discordie encoder does resampling if rate != 48000
                    var options = {
                        frameDuration: 60,
                        sampleRate: pcmfmt.sampleRate,
                        channels: pcmfmt.channels,
                        float: false
                    };

                    var encoderStream = info.voiceConnection.getEncoderStream(options);
                    if (!encoderStream) {
                        return console.log(
                            "Unable to get encoder stream, connection is disposed"
                        );
                    }

                    info.voiceConnection.getEncoder().setVolume(20);

                    encoderStream.resetTimestamp();
                    encoderStream.removeAllListeners("timestamp");

                    mp3decoder.pipe(encoderStream);
                });
            });
        }
    });
};