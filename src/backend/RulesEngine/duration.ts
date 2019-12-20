import { Duration } from './types';

type Caches = {
    [x in string]: Cache;
};

interface Cache {
    duration?: Duration;
    activeTimerID?: string;
}

const cache: Caches = {};

export function AddDuration(ruleName: string, ruleID: string, fact: string, duration: Duration): void {
    const key: string = ruleName + ruleID + fact;
    cache[key] = {
        duration: duration,
        activeTimerID: '',
    };
}

export function ProcessDurationIfExists(ruleName: string, ruleID: string, fact: string): boolean {
    return false;
}
