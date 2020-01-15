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
// export function ProcessDurationIfExists(ruleName: string, ruleID: string, fact: string): boolean {
//     return false;
// }
