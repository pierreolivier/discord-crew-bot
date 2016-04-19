/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');
var lame = require('lame');
var request = require('request');
var async = require('async');

var bot = require('./bot');
var configuration = require('../configuration');

/**
 * Features class
 * @param bot Bot object
 * @constructor
 */
function Features(bot) {
    this.bot = bot;

    this.init();
}

/**
 * Init objects (tts queue)
 */
Features.prototype.init = function() {
    var object = this;

    object.ttsQueue = async.queue(function (task, callback) {
        var voice = task.voice;
        var text = task.text;
        var done = false;

        if (!object.bot.client.VoiceConnections.length) {
            return console.log("Voice not connected");
        }

        var info = object.bot.client.VoiceConnections[0];

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

            mp3decoder.pipe(encoderStream);
            encoderStream.once("unpipe", function() {
                if (!done) {
                    callback();
                }
            });
            mp3decoder.once('end', function() {
                done = true;

                setTimeout(callback, 1000);
            });
        });
    }, 1);
};

/**
 * Start tts
 * @param voice Voice
 * @param text Text
 */
Features.prototype.tts = function(voice, text) {
    this.ttsQueue.push({voice: voice, text: text});
};

/**
 * Empty the tts queue
 */
Features.prototype.stopTts = function() {
    this.ttsQueue.kill();
};

/**
 * Start a youtube video
 * @param search Keywords
 */
Features.prototype.youtube = function(search) {
    var object = this;
    if (!object.bot.client.VoiceConnections.length) {
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

// ffmpeg -i silence.m4a -af silencedetect=n=-50dB:d=0.25 -y output.wav 2>&1 | grep silence_duration

module.exports = Features;