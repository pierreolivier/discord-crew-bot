/**
 * Created by pierreolivier on 12/04/16.
 */

exports.shorten = function(str, length) {
    if (str.length >= length) {
        var trimmedString = str.substr(0, length);
        var index = trimmedString.lastIndexOf(" ");

        return [].concat.apply([], [trimmedString.substr(0, Math.min(trimmedString.length, index)), shorten(str.substr(index + 1, str.length), length)]);
    } else {
        return [str];
    }
}