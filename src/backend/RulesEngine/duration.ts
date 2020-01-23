import { Duration, TimeFrame, RuleParams } from './types';
import { TopLevelCondition, Event } from 'json-rules-engine';
import { Entities } from './async';
import { FactData } from './utils';

interface Duration {
    duration: number;
}

type Durations = {
    [x in string]: Duration;
};

const cache: Durations = {};

function getKey(ruleId: string, entities: Entities): string {
    return `${ruleId}_${JSON.stringify(Object.keys(entities).sort())}`;
}

export function processDuration(
    conditions: TopLevelCondition,
    timeframe: TimeFrame,
    ruleParams: RuleParams,
    entities: Entities,
    actionTopic: string,
    incomingData: FactData,
): void {
    const key: string = getKey(ruleParams.ruleID, entities);
    if (cache[key]) {
        // timer(s) already running
    } else {
        cache[key] = {
            entities,
        };
    }
}
