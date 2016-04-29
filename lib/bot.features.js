/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');
var lame = require('lame');
var request = require('request');
var async = require('async');
var gm = require('gm');
var jsdom = require("jsdom");

var bot = require('./bot');
var utils = require('./utils');
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
                    done = true;
                    callback();
                }
            });
            mp3decoder.once('end', function() {
                setTimeout(function() {
                    if (!done) {
                        done = true;
                        callback();
                    }
                }, 1000);
            });
            setTimeout(function() {
                if (!done) {
                    done = true;
                    callback();
                }
            }, 15000);
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

            if (object.bot.configuration.onYoutube != undefined) {
                object.bot.configuration.onYoutube(object.bot, 'https://www.youtube.com/watch?v=' + id);
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

/**
 * Send a meme
 * @param e Discord api object
 * @param message Message
 * @param image Path of the image
 * @param color Text color
 * @param x
 * @param y
 */
Features.prototype.meme = function(response, message, image, color, x, y) {
    var imageWidth = '500';
    var charWidth = '26';

    var lines = utils.shorten(message, 22);
    var lineWidth = 0;
    for (var i in lines) {
        if (lines[i].length > lineWidth) {
            lineWidth = lines[i].length;
        }
    }
    lineWidth *= charWidth;

    message = lines.join("\n");

    x = imageWidth / 2 - lineWidth / 2 + 20;
    if(x < 20) {
        x = 20;
    }

    gm(image)
        .stroke("#000000")
        .fill(color)
        .font("assets/impact-opt.ttf", 50)
        .drawText(x, y, message, 'Centers')
        .quality(100)
        .write(image + ".2.png", function (err) {
            response.message.channel.uploadFile(image + ".2.png", null, response.message.author.username + ':');
        });
};

/**
 * Search on wikipedia and play it
 * @param search Search
 */
Features.prototype.wikipedia = function(search) {
    var object = this;

    if (search != undefined && search.length > 0) {
        request('https://' + configuration.discord.wiki.host + '/w/api.php?action=opensearch&search=' + encodeURI(search), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var json = JSON.parse(body);

                object.playWikipedia(json[3][0]);
            }
        });
    } else {
        object.playWikipedia('https://' + configuration.discord.wiki.host + configuration.discord.wiki.random);
    }
};

/**
 * Play the first sentence of a wikipedia url
 * @param url Url
 */
Features.prototype.playWikipedia = function(url) {
    var object = this;

    jsdom.env(url, ["http://code.jquery.com/jquery.js"], function (err, window) {
        var text = window.$(window.$('#mw-content-text').children('p').get(0)).text();

        if (text.indexOf('.') != -1) {
            text = text.substr(0, text.indexOf('.'));
        }

        if (object.bot.configuration.onWiki != undefined) {
            object.bot.configuration.onWiki(object.bot, text, window.location.href);
        }
    });
};

// ffmpeg -i silence.m4a -af silencedetect=n=-50dB:d=0.25 -y output.wav 2>&1 | grep silence_duration

module.exports = Features;