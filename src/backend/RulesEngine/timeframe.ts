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

interface TimeframeObj {
    days: Days[];
    ruleDay: Days;
    ruleHours: number;
    ruleMinutes: number;
    startTime: number[];
    endTime: number[];
}

function checkRepeatByDay(timeframeObj: TimeframeObj): boolean {
    const { ruleHours, ruleMinutes, startTime, endTime } = timeframeObj;
    if (ruleHours < startTime[0] || ruleHours > endTime[0]) {
        return false;
    } else if (ruleHours === startTime[0] && ruleMinutes < startTime[1]) {
        return false;
    } else if (ruleHours === endTime[0] && ruleMinutes > endTime[1]) {
        return false;
    }
    return true;
}

function checkRepeatEachWeek(timeframeObj: TimeframeObj): boolean {
    const { days, ruleDay, ruleHours, ruleMinutes, startTime, endTime } = timeframeObj;
    if (ruleDay === days[0]) {
        if (ruleHours < startTime[0]) {
            return false;
        } else if (ruleHours === startTime[0] && ruleMinutes < startTime[1]) {
            return false;
        }
    } else if (ruleDay === days[days.length - 1]) {
        if (ruleHours > endTime[1]) {
            return false;
        } else if (ruleHours === endTime[0] && ruleMinutes > endTime[1]) {
            return false;
        }
    }
    return true
}

export function DoesTimeframeMatchRule(timestamp: string, timeframe: TimeFrame | undefined): boolean {
    if (!timeframe) {return false;}
    const ruleDate: Date = new Date(timestamp);
    const ruleDay = DaysOfTheWeek[ruleDate.getUTCDay()];
    const ruleHours = ruleDate.getUTCHours();
    const ruleMinutes = ruleDate.getUTCMinutes();
    const { days } = timeframe;
    
    const startTime: number[] = timeframe.startTime.split(':').map((t) => parseInt(t));
    const endTime: number[] = timeframe.endTime.split(':').map((t) => parseInt(t));
    
    if (checkForValidTimeframeFormat([startTime, endTime])) {
        if (days.indexOf(ruleDay) > -1) {
            switch (timeframe.type) {
                case TimeFrameTypes.REPEATEACHWEEK:
                    return checkRepeatEachWeek({ days, ruleDay, ruleHours, ruleMinutes, startTime, endTime })
                case TimeFrameTypes.REPEATBYDAY:
                    return checkRepeatByDay({ days, ruleDay, ruleHours, ruleMinutes, startTime, endTime });
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
