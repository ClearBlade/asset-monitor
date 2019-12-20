"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
// @ts-ignore
var log = global.log;
function DoesTimeframeMatchRule(timeframe) {
    var today = new Date();
    var todaysDay = types_1.DaysOfTheWeek[today.getDay()];
    switch (timeframe.type) {
        case types_1.TimeFrameTypes.REPEATEACHWEEK:
        case types_1.TimeFrameTypes.REPEATBYDAY:
            for (var idx in timeframe.days) {
                if (timeframe.days[idx] === todaysDay) {
                    return checkForValidTimeframe(today, timeframe);
                }
            }
            log('Days dont match with rule: ' + todaysDay);
            return false;
        default:
            return true;
    }
}
exports.DoesTimeframeMatchRule = DoesTimeframeMatchRule;
function checkForValidTimeframe(today, timeframe) {
    var startTime = timeframe.startTime;
    var endTime = timeframe.endTime;
    var startTimeSplit = startTime.split(':');
    var endTimeSplit = endTime.split(':');
    if (startTimeSplit.length != 2) {
        log('Invalid start time set for timeframe ' + JSON.stringify(timeframe));
        return false;
    }
    if (endTimeSplit.length != 2) {
        log('Invalid end time set for timeframe ' + JSON.stringify(timeframe));
        return false;
    }
    if (today.getHours() < parseInt(startTimeSplit[0]) || today.getHours() > parseInt(endTimeSplit[0])) {
        log('Hours dont match ' + today.getHours());
        return false;
    }
    if (today.getMinutes() < parseInt(startTimeSplit[1]) || today.getMinutes() > parseInt(endTimeSplit[1])) {
        log('Minutes dont match ' + today.getMinutes());
        return false;
    }
    return true;
}
