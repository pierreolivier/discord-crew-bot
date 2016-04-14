var bot = require('./lib/discord-bot');
var log = require('util').log;

exports.run = function() {
    console.log('');
    log('Bot starting...');

    bot.run();
};

process.on('uncaughtException', function ( err ) {
    log('Error:');
    console.error(err.stack);
    log('Bot restarting...');

    bot.stop();

    bot.run();
});

function stop() {
    log('Bot stoping...');

    bot.stop();
    setTimeout(function() {
        process.exit(0);
    }, 1000);
}

process.on('SIGINT', function() {
    stop();
});

process.on('SIGTERM', function() {
    stop();
});