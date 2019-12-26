import { TimeFrame, TimeFrameTypes, DaysOfTheWeek, Days } from './types';
import { start } from 'repl';

function checkForValidTimeframeFormat(timeTuples: Array<number[]>): boolean {
    timeTuples.forEach((a) => {
        if (a.length !== 2) {
            return false;
        }
        a.forEach((t, idx) => {
            if (t === NaN) { // valid number
                return false;
            } else if (idx === 0) { // valid hours
                if (t < 0 || t > 24) {
                    return false;
                }
            } else if (idx === 1) { // valid minutes
                if (t < 0 || t > 59) {
                    return false
                }
            }
        })
    })
    return true;
}

function checkRepeatByDay(ruleTime: number[], startTime: number[], endTime: number[]) {
    if (ruleTime[0] < startTime[0] || ruleTime[0] > endTime[0]) {
        return false;
    } else if (ruleTime[0] === startTime[0] && ruleTime[1] < startTime[1]) {
        return false;
    } else if (ruleTime[0] === endTime[0] && ruleTime[1] > endTime[1]) {
        return false;
    }
    return true;
}

function checkRepeatEachWeek(ruleTime: number[], startTime: number[], endTime: number[]) {
    return true;
}

export function DoesTimeframeMatchRule(timestamp: string, timeframe: TimeFrame): boolean {
    const ruleDate: Date = new Date(timestamp);
    const ruleDay = DaysOfTheWeek[ruleDate.getUTCDay()];
    const ruleHours = ruleDate.getUTCHours();
    const ruleMinutes = ruleDate.getUTCMinutes();
    
    const startTime: number[] = timeframe.startTime.split(':').map((t) => parseInt(t));
    const endTime: number[] = timeframe.endTime.split(':').map((t) => parseInt(t));
    
    if (checkForValidTimeframeFormat([startTime, endTime])) {
        if (timeframe.days.indexOf(ruleDay) > -1) {
            switch (timeframe.type) {
                case TimeFrameTypes.REPEATEACHWEEK:
                    return checkRepeatEachWeek([ruleHours, ruleMinutes], startTime, endTime)
                case TimeFrameTypes.REPEATBYDAY:
                    return checkRepeatByDay([ruleHours, ruleMinutes], startTime, endTime);
                default:
                    return false;
            }
        }
        // log(`${ruleDay} does not fall within timeframe`);
        return false
    }
    // log(`Invalid time format. Start time: ${timeframe.startTime}. End time: ${timeframe.endTime}`);
    return false;
}
