import { RuleParams, ProcessedCondition, WithParsedCustomData, Entities } from './types';
interface Timer {
    conditions: ProcessedCondition[];
    entities: Entities;
    actionTopic: string;
    incomingData: WithParsedCustomData;
    ruleParams: RuleParams;
    timerId: string;
    timedEntity: ProcessedCondition;
}
interface Timers {
    [x: string]: Timer;
}
export declare const DURATION_TOPIC = "rule_duration_reached";
export declare class DurationEngine {
    private static _instance;
    timerCache: CbServer.Cache<Timers>;
    messaging: CbServer.Messaging;
    constructor();
    static getInstance(): DurationEngine;
    getCacheHandler(ruleId: string, callback: (data: Timers) => void): void;
    clearTimersForRule(ruleId: string): void;
    clearTimer(ruleId: string, key: string): void;
    timerExecuted(err: boolean, data: string | null): void;
    startTimerAndGetId(key: string, ruleId: string, timer: Timer): Promise<string>;
    modifyTimer(conditions: ProcessedCondition[], existingTimer: Timer, entities: Entities, ruleId: string, incomingData: WithParsedCustomData): Promise<Timer>;
    evaluateIncomingCombination(combination: ProcessedCondition[], ruleParams: RuleParams, timer: Timer, key: string, entities: Entities, actionTopic: string, incomingData: WithParsedCustomData): Promise<Timer>;
    processDurations(combinations: Array<ProcessedCondition[]>, ruleParams: RuleParams, entities: Entities, actionTopic: string, incomingData: WithParsedCustomData): void;
}
export {};
