/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');

/**
 * Disrespect database
 * @type {Array} Disrespect messages (strings)
 */
var disrespectDatabase = [];

/**
 * Load the disrespect database (assets/disrespect.json)
 */
exports.loadDisrespect = function() {
    if (fs.existsSync('assets/disrespect.json')) {
        try {
            disrespectDatabase = JSON.parse(fs.readFileSync('assets/disrespect.json').toString());
        } catch (e) {
            console.error("Can't parse assets/disrespect.json");
        }
    }
};

/**
 * Save the disrespect database (assets/disrespect.json)
 */
exports.saveDisrespect = function() {
    fs.writeFileSync('assets/disrespect.json', JSON.stringify(disrespectDatabase) , 'utf-8');
};

/**
 * Add a disrespect message and get one randomly
 * @param text Disrespect message
 * @returns {string} Random disrespect message
 */
exports.addAndGetDisrespect = function(text) {
    if (disrespectDatabase.indexOf(text) == -1) {
        disrespectDatabase.push(text);

        exports.saveDisrespect();
    }

    return disrespectDatabase[Math.floor(Math.random() * disrespectDatabase.length)];
};

/**
 * Get the disrespect database
 * @returns {Array} Array of disrespect message (strings)
 */
exports.getDisrespectDatabase = function() {
    return disrespectDatabase;
};