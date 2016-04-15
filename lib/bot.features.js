/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');
var lame = require('lame');
var request = require('request');
var log = require('util').log;

var bot = require('./bot');
var configuration = require('../configuration');

function Features(bot) {
    this.bot = bot;
}

Features.prototype.tts = function(voice, text) {
    if (!this.bot.client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = this.bot.client.VoiceConnections[0];

    var mp3decoder = new lame.Decoder();

    request(configuration.discord.tts + "voice=" + encodeURI(voice) + "&text=" + encodeURI(text)).pipe(mp3decoder);

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

Features.prototype.youtube = function(search) {
    var object = this;
    if (!this.bot.client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    request('https://www.googleapis.com/youtube/v3/search?part=id&type=video&key=' + configuration.discord.google + '&q=' + encodeURI(search), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            var id = json['items'][0]['id']['videoId'];

            if (object.bot.configuration.onNewMusic != undefined) {
                object.bot.configuration.onNewMusic(object.bot, 'https://www.youtube.com/watch?v=' + id);
            }

            request('http://www.youtubeinmp3.com/download/?video=https://www.youtube.com/watch?v=' + id, function (error, response, body) {
                var indexStart = body.indexOf("/download/get/");
                var indexEnd = body.indexOf("\">", indexStart);

                var url = body.substr(indexStart, indexEnd - indexStart);

                var info = object.bot.client.VoiceConnections[0];

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

                    info.voiceConnection.getEncoder().setVolume(50);

                    encoderStream.resetTimestamp();
                    encoderStream.removeAllListeners("timestamp");

                    mp3decoder.pipe(encoderStream);
                });
            });
        }
    });
};

module.exports = Features;