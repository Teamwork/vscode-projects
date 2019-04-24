"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utilities {
    static DateCompare(date, compareDuration) {
        var moment = require('moment');
        var startMoment = moment(date);
        var endMoment = moment();
        var dif = endMoment.diff(startMoment, 'minutes');
        if (dif > compareDuration)
            return true;
        return false;
    }
}
exports.Utilities = Utilities;
//# sourceMappingURL=utilities.js.map