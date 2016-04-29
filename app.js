var bot = require('./lib/bot');
var log = require('util').log;

/**
 * Start the bot
 */
exports.run = function() {
    console.log('');
    log('Bot starting...');

    bot.run();
};

/**
 * Stop the bot
 */
exports.stop = function() {
    log('Bot stopping...');

    bot.stop();
    setTimeout(function() {
        process.exit(0);
    }, 1000);
};

/**
 * On error
 */
process.on('uncaughtException', function ( err ) {
    log('Error:');
    console.error(err.stack);
    log('Bot restarting...');

    setTimeout(function() {
        bot.stop();

        // bot.run();
        setTimeout(function() {
            process.exit(0);
        }, 3000);
    }, 1000);
});

/**
 * Events
 */
process.on('SIGINT', function() {
    exports.stop();
});

process.on('SIGTERM', function() {
    exports.stop();
});