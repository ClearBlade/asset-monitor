"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
function checkForValidTimeframeFormat(timeTuples) {
    timeTuples.forEach(function (a) {
        if (a.length !== 2) {
            return false;
        }
        a.forEach(function (t, idx) {
            if (isNaN(t)) {
                // valid number
                return false;
            }
            else if (idx === 0) {
                // valid hours
                if (t < 0 || t > 24) {
                    return false;
                }
            }
            else if (idx === 1) {
                // valid minutes
                if (t < 0 || t > 59) {
                    return false;
                }
            }
        });
    });
    return true;
}
function checkRepeatByDay(timeframeObj) {
    var ruleHours = timeframeObj.ruleHours, ruleMinutes = timeframeObj.ruleMinutes, startTime = timeframeObj.startTime, endTime = timeframeObj.endTime;
    if (ruleHours < startTime[0] || ruleHours > endTime[0]) {
        return false;
    }
    else if (ruleHours === startTime[0] && ruleMinutes < startTime[1]) {
        return false;
    }
    else if (ruleHours === endTime[0] && ruleMinutes > endTime[1]) {
        return false;
    }
    return true;
}
function checkRepeatEachWeek(timeframeObj) {
    var days = timeframeObj.days, ruleDay = timeframeObj.ruleDay, ruleHours = timeframeObj.ruleHours, ruleMinutes = timeframeObj.ruleMinutes, startTime = timeframeObj.startTime, endTime = timeframeObj.endTime;
    if (ruleDay === days[0]) {
        if (ruleHours < startTime[0]) {
            return false;
        }
        else if (ruleHours === startTime[0] && ruleMinutes < startTime[1]) {
            return false;
        }
    }
    else if (ruleDay === days[days.length - 1]) {
        if (ruleHours > endTime[1]) {
            return false;
        }
        else if (ruleHours === endTime[0] && ruleMinutes > endTime[1]) {
            return false;
        }
    }
    return true;
}
function doesTimeframeMatchRule(timestamp, timeframe) {
    if (!timeframe) {
        return true;
    }
    var ruleDate = new Date(timestamp);
    var ruleDay = types_1.DaysOfTheWeek[ruleDate.getUTCDay()];
    var ruleHours = ruleDate.getUTCHours();
    var ruleMinutes = ruleDate.getUTCMinutes();
    var days = timeframe.days;
    var startTime = timeframe.startTime.split(':').map(function (t) { return parseInt(t); });
    var endTime = timeframe.endTime.split(':').map(function (t) { return parseInt(t); });
    if (checkForValidTimeframeFormat([startTime, endTime])) {
        if (days.indexOf(ruleDay) > -1) {
            switch (timeframe.type) {
                case types_1.TimeFrameTypes.REPEATEACHWEEK:
                    return checkRepeatEachWeek({ days: days, ruleDay: ruleDay, ruleHours: ruleHours, ruleMinutes: ruleMinutes, startTime: startTime, endTime: endTime });
                case types_1.TimeFrameTypes.REPEATBYDAY:
                    return checkRepeatByDay({ days: days, ruleDay: ruleDay, ruleHours: ruleHours, ruleMinutes: ruleMinutes, startTime: startTime, endTime: endTime });
                default:
                    return false;
            }
        }
        // log(`${ruleDay} does not fall within timeframe`);
        return false;
    }
    // log(`Invalid time format. Start time: ${timeframe.startTime}. End time: ${timeframe.endTime}`);
    return false;
}
exports.doesTimeframeMatchRule = doesTimeframeMatchRule;
