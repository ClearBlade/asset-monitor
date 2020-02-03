import { RuleParams } from './types';
import { TopLevelCondition } from 'json-rules-engine';
import { Entities } from './async';
import { FactData, ProcessedCondition } from './utils';

interface Timer {
    duration: number;
}

type Timers = {
    [x in string]: Timer;
};

const timerStore: Timers = {};

function getKey(ruleId: string, ids: string[]): string {
    return `${ruleId}_${JSON.stringify(ids)}`;
}

export function processDurations(
    validCombinations: Array<ProcessedCondition[]>,
    conditions: TopLevelCondition,
    ruleParams: RuleParams,
    entities: Entities,
    actionTopic: string,
    incomingData: FactData,
): void {
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
