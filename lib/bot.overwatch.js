/**
 * Created by po on 9/26/16.
 */
var log = require('util').log;

var bot = require('./bot');
var request = require('request');
var async = require('async');
var jsdom = require("jsdom");

/**
 * Api class
 * @param bot Bot object
 * @constructor
 */
function Overwatch(bot) {
    this.bot = bot;
    this.ranks = {};
    this.thread = undefined;
    if (bot.configuration.battletags != undefined) {
        this.users = bot.configuration.battletags;
    } else {
        this.users = [];
    }
}

Overwatch.prototype.start = function() {
    var object = this;

    log('starting overwatch');

    this.thread = setInterval(function() {
        async.eachSeries(object.users, function(user, callback) {
            request({
                uri: 'https://playoverwatch.com/fr-fr/career/pc/eu/' + user,
                method: 'GET'
            }, function (err, res, body) {
                jsdom.env(body, function (err, window) {
                    var rank = object.ranks[user];
                    var currentRank = window.document.getElementsByClassName("competitive-rank")[0].children[1].innerHTML;

                    if (rank == undefined) {
                        object.ranks[user] = currentRank;

                        // object.ranks[user]--; // TODO remove
                    } else if (rank !== currentRank) {
                        object.ranks[user] = currentRank;

                        if (object.bot.configuration.onNewOverwatchRank != undefined) {
                            object.bot.configuration.onNewOverwatchRank(object.bot, user, rank, currentRank);
                        }

                        console.log(user + ' ' + currentRank);
                    }

                    window.close();

                    callback();
                });
            });
        }, function(err) {

        });
    }, 60000);
};

Overwatch.prototype.stop = function() {
    if (this.thread != undefined) {
        clearInterval(this.thread);
    }
};

Overwatch.prototype.players = function() {
    var result = '';

    for (var i in this.ranks) {
        result += i + ': ' + this.ranks[i] + "\n";
    }

    return result;
};

module.exports = Overwatch;
