/**
 * Created by pierreoliver on 15/04/16.
 */
var fs = require('fs');

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