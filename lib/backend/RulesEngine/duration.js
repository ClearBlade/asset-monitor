"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var timerStore = {};
function getKey(ruleId, ids) {
    return ruleId + "_" + JSON.stringify(ids);
}
function processDurations(validCombinations, conditions, ruleParams, entities, actionTopic, incomingData) {
    // for (let i = 0; i < validCombinations.length; i++) {
    //     const key = getKey(ruleParams.ruleID, validCombinations[i]);
    //     if (timerStore[key]) {
    //         // update values
    //     } else {
    //         // create new key
    //         // include:
    //     }
    // }
}
exports.processDurations = processDurations;
