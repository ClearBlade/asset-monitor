import { Duration } from "./types";

let cache = {};

export function AddDuration(ruleName: string, ruleID: string, fact: string, duration: Duration): void {
    let key: string = ruleName + ruleID + fact;
    cache[key] = {
        "duration": duration,
        "activeTimerID": "" 
    };
}

export function ProcessDurationIfExists(ruleName: string, ruleID: string, fact: string): boolean {
    return false;
}

