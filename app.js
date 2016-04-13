var bot = require('./lib/discord-bot');

exports.run = function() {
    bot.run();
};

process.on('uncaughtException', function ( err ) {
    console.error(err.stack);

    bot.stop();

    bot.run();
});