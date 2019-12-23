import { TimeFrame, TimeFrameTypes, DaysOfTheWeek } from './types';

function checkForValidTimeframe(today: Date, timeframe: TimeFrame): boolean {
    const startTime: string = timeframe.startTime;
    const endTime: string = timeframe.endTime;
    const startTimeSplit: Array<string> = startTime.split(':');
    const endTimeSplit: Array<string> = endTime.split(':');
    if (startTimeSplit.length != 2) {
        // log('Invalid start time set for timeframe ' + JSON.stringify(timeframe));
        return false;
    }
    if (endTimeSplit.length != 2) {
        // log('Invalid end time set for timeframe ' + JSON.stringify(timeframe));
        return false;
    }
    if (today.getHours() < parseInt(startTimeSplit[0]) || today.getHours() > parseInt(endTimeSplit[0])) {
        // log('Hours dont match ' + today.getHours());
        return false;
    }
    if (today.getMinutes() < parseInt(startTimeSplit[1]) || today.getMinutes() > parseInt(endTimeSplit[1])) {
        // log('Minutes dont match ' + today.getMinutes());
        return false;
    }
    return true;
}

export function DoesTimeframeMatchRule(timeframe: TimeFrame): boolean {
    const today: Date = new Date();
    const todaysDay: string = DaysOfTheWeek[today.getDay()];
    switch (timeframe.type) {
        case TimeFrameTypes.REPEATEACHWEEK:
        case TimeFrameTypes.REPEATBYDAY:
            for (const idx in timeframe.days) {
                if (timeframe.days[idx] === todaysDay) {
                    return checkForValidTimeframe(today, timeframe);
                }
            }
            // log('Days dont match with rule: ' + todaysDay);
            return false;
        default:
            return true;
    }
}
