/**
 * Created by pierreolivier on 15/04/16.
 */
var bot = require('./bot');

exports.joinVoiceChannel = function(server, channel) {
    const guild = bot.client().Guilds.getBy("id", server);
    if (!guild) return log("Guild not found: " + server);

    if (channel != '') {
        const voice = guild.voiceChannels.find(function (c) {
            return c.name == channel
        });
        if (!voice) return log("Channel not found: " + channel);

        voice.join(false, false);
    } else {
        var maxMembers = 0;
        var voiceChannel = guild.voiceChannels[0];
        for (var i in guild.voiceChannels) {
            var members = guild.voiceChannels[i].members;

            if (members.length > maxMembers) {
                maxMembers = members.length;
                voiceChannel = guild.voiceChannels[i];
            }
        }
        voiceChannel.join(false, false);
    }
};

exports.leaveVoiceChannel = function() {
    bot.client().Channels.filter(function(channel) { return channel.type == "voice" && channel.joined })
        .forEach(function(channel) { channel.leave() });
};

exports.stopVoice = function() {
    if (!bot.client().VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = bot.client().VoiceConnections[0];
    info.voiceConnection.getEncoder().kill();
};