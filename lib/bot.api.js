/**
 * Created by pierreolivier on 15/04/16.
 */
var log = require('util').log;
var bot = require('./bot');

function Api(bot) {
    this.bot = bot;
}

Api.prototype.sendMessage = function(server, channel, text) {
    const guild = this.bot.client.Guilds.getBy("id", server);
    if (!guild) return log("Guild not found: " + server);

    const textChannel = guild.textChannels.find(function (c) {
        return c.name == channel
    });
    if (!textChannel) return log("Channel not found: " + channel);

    textChannel.sendMessage(text);
};

Api.prototype.joinVoiceChannel = function(server, channel) {
    const guild = this.bot.client.Guilds.getBy("id", server);
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
            var length = members.length;

            if (members != undefined) {
                members.forEach(function(member) {
                    bot.bots().forEach(function(bot) {
                        if (member.id == bot.id) {
                            length--;
                        }
                    });
                });
            }

            if (length > maxMembers) {
                maxMembers = length;
                voiceChannel = guild.voiceChannels[i];
            }
        }
        voiceChannel.join(false, false);
    }
};

Api.prototype.leaveVoiceChannel = function() {
    this.bot.client.Channels.filter(function(channel) { return channel.type == "voice" && channel.joined })
        .forEach(function(channel) { channel.leave() });
};

Api.prototype.stopVoice = function() {
    if (!this.bot.client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    var info = this.bot.client.VoiceConnections[0];
    info.voiceConnection.getEncoder().kill();
};

Api.prototype.commands = function() {
    var meme = this.bot.configuration.meme;
    var commands = this.bot.configuration.commands;
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

module.exports = Api;