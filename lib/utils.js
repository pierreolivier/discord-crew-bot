/**
 * Created by pierreolivier on 12/04/16.
 */

/**
 * Shorten a string
 * @param str String
 * @param length Number of characters
 * @returns {*}
 */
exports.shorten = function(str, length) {
    if (str.length >= length) {
        var trimmedString = str.substr(0, length);
        var index = trimmedString.lastIndexOf(" ");
        if (index == -1) {
            return [str];
        }

        return [].concat.apply([], [trimmedString.substr(0, Math.min(trimmedString.length, index)), exports.shorten(str.substr(index + 1, str.length), length)]);
    } else {
        return [str];
    }
};