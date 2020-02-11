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
interface TimersForRule {
    [x: string]: Timer;
}
interface Timers {
    [x: string]: TimersForRule;
}
export declare const DURATION_TOPIC = "rule_duration_reached";
export declare class DurationEngine {
    private static _instance;
    timerStore: Timers;
    messaging: CbServer.Messaging;
    constructor();
    static getInstance(): DurationEngine;
    clearTimersForRule(ruleId: string): void;
    clearTimer(ruleId: string, key: string): void;
    timerExecuted(err: boolean, data: string | null): void;
    startTimer(key: string, ruleId: string, timer: Timer): void;
    evaluateIncomingConditions(conditions: ProcessedCondition[], existingTimer: Timer, entities: Entities, ruleId: string, incomingData: WithParsedCustomData): void;
    processDurations(combinations: Array<ProcessedCondition[]>, ruleParams: RuleParams, entities: Entities, actionTopic: string, incomingData: WithParsedCustomData): void;
}
export {};
