var bot = require('./lib/bot');
var log = require('util').log;

exports.run = function() {
    console.log('');
    log('Bot starting...');

    bot.run();
};

exports.stop = function() {
    log('Bot stopping...');

    bot.stop();
    setTimeout(function() {
        process.exit(0);
    }, 1000);
};

process.on('uncaughtException', function ( err ) {
    log('Error:');
    console.error(err.stack);
    log('Bot restarting...');

    bot.stop();

    bot.run();
});

process.on('SIGINT', function() {
    exports.stop();
});

process.on('SIGTERM', function() {
    exports.stop();
});