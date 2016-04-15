/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');
var lame = require('lame');
var request = require('request');

var bot = require('./bot');
var configuration = require('../configuration');

var disrespectDatabase = [];

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

exports.tts = function(voice, text) {
    if (!bot.client().VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = bot.client().VoiceConnections[0];

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
    if (!bot.client().VoiceConnections.length) {
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

                var info = bot.client().VoiceConnections[0];

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

                    info.voiceConnection.getEncoder().setVolume(35);

                    encoderStream.resetTimestamp();
                    encoderStream.removeAllListeners("timestamp");

                    mp3decoder.pipe(encoderStream);
                });
            });
        }
    });
};