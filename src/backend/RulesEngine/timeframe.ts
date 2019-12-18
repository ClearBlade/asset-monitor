import { TimeFrame, TimeFrameTypes, DaysOfTheWeek } from "./types";

export function DoesTimeframeMatchRule(timeframe: TimeFrame): boolean {
    let today: Date = new Date();
    let todaysDay: string = DaysOfTheWeek[today.getDay()];
    switch(timeframe.type) {
        case TimeFrameTypes.REPEATEACHWEEK:
        case TimeFrameTypes.REPEATBYDAY:
            for(let idx in timeframe.days) {
                if(timeframe.days[idx] === todaysDay) {
                    return checkForValidTimeframe(today, timeframe);
                }
            }
            log("Days dont match with rule: " + todaysDay);
            return false;
        default:
            return true;
    }
}

function checkForValidTimeframe(today: Date, timeframe: TimeFrame): boolean {
    let startTime: string = timeframe.startTime;
    let endTime: string = timeframe.endTime;
    let startTimeSplit: Array<string> = startTime.split(":");
    let endTimeSplit: Array<string> = endTime.split(":");
    if(startTimeSplit.length != 2) {
        log("Invalid start time set for timeframe " + JSON.stringify(timeframe));
        return false;
    }
    if(endTimeSplit.length != 2) {
        log("Invalid end time set for timeframe " + JSON.stringify(timeframe));
        return false;
    }
    if(today.getHours() < parseInt(startTimeSplit[0]) || today.getHours() > parseInt(endTimeSplit[0])) {
        log("Hours dont match " + today.getHours());
        return false;
    }
    if(today.getMinutes() < parseInt(startTimeSplit[1]) || today.getMinutes() > parseInt(endTimeSplit[1])) {
        log("Minutes dont match " + today.getMinutes());
        return false;
    }
    return true;
}