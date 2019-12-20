"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cache = {};
function AddDuration(ruleName, ruleID, fact, duration) {
    var key = ruleName + ruleID + fact;
    cache[key] = {
        duration: duration,
        activeTimerID: '',
    };
}
exports.AddDuration = AddDuration;
function ProcessDurationIfExists(ruleName, ruleID, fact) {
    return false;
}
exports.ProcessDurationIfExists = ProcessDurationIfExists;
