import { RuleParams, ProcessedCondition, WithParsedCustomData, Entities } from './types';
import uuid = require('uuid/v4');
import { processSuccessfulEvent } from './events';

interface Timer {
    conditions: ProcessedCondition[];
    entities: Entities;
    actionTopic: string;
    incomingData: WithParsedCustomData;
    ruleParams: RuleParams;
    timerId: string;
    timedEntity: ProcessedCondition; // entity whose duration is currently counting for the whole event
}

interface TimersForRule {
    [x: string]: Timer;
}

interface Timers {
    [x: string]: TimersForRule;
}

export const DURATION_TOPIC = 'rule_duration_reached';

export class DurationEngine {
    private static _instance: DurationEngine;

    timerStore: Timers;
    messaging: CbServer.Messaging;

    constructor() {
        this.timerStore = {};
        this.messaging = ClearBlade.Messaging();
        // this.messaging.subscribe(DURATION_TOPIC, this.timerExecuted);
    }

    static getInstance(): DurationEngine {
        if (!DurationEngine._instance) {
            DurationEngine._instance = new DurationEngine();
        }
        return DurationEngine._instance;
    }

    clearTimersForRule(ruleId: string): void {
        if (this.timerStore[ruleId]) {
            const timersForRule = this.timerStore[ruleId];
            const keys = Object.keys(timersForRule);
            for (let i = 0; i < keys.length; i++) {
                const timer = timersForRule[keys[i]];
                this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            }
            delete this.timerStore[ruleId];
        }
    }

    clearTimer(ruleId: string, key: string): void {
        if (this.timerStore[ruleId] && this.timerStore[ruleId][key]) {
            const timer = this.timerStore[ruleId][key];
            this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            delete this.timerStore[ruleId][key];
        }
        if (!Object.keys(this.timerStore[ruleId]).length) {
            delete this.timerStore[ruleId];
        }
    }

    timerExecuted(err: boolean, data: string | null): void {
        if (err) {
            log(`Error on subscription: ${data}}`);
        } else if (data) {
            const { userData } = JSON.parse(data as string);
            const { key, ruleId } = JSON.parse(userData);

            const { conditions, entities, actionTopic, incomingData, ruleParams } = this.timerStore[ruleId][key];
            const ids = [];
            for (let i = 0; i < conditions.length; i++) {
                if (!conditions[i].result) {
                    this.clearTimer(ruleId, key);
                    return;
                } else {
                    ids.push(conditions[i].id);
                }
            }
            processSuccessfulEvent(ids, ruleParams, entities, actionTopic, incomingData);
            if (ruleParams.ruleType === 'any') {
                this.clearTimersForRule(ruleParams.ruleID);
            }
        }
    }

    startTimer(key: string, ruleId: string, timer: Timer): void {
        const timerId = uuid();
        const remainingTime = timer.timedEntity.duration - (Date.now() - timer.timedEntity.timerStart);
        const data = JSON.stringify({
            ruleId,
            key,
        });
        timer.timerId = timerId;
        this.messaging.setTimeout(remainingTime, DURATION_TOPIC, data, createTimeoutCallback);
    }

    evaluateIncomingConditions(
        conditions: ProcessedCondition[],
        existingTimer: Timer,
        entities: Entities,
        ruleId: string,
        incomingData: WithParsedCustomData,
    ): void {
        const timedCondition = conditions.find(c => c.id === existingTimer.timedEntity.id) as ProcessedCondition;
        if (!timedCondition.result) {
            delete existingTimer.timedEntity;
        }

        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].result) {
                handleTrueCondition(conditions[i], existingTimer, i); // may update existingTimer if remaing time for any exceeds the current timed entity
            } else if (existingTimer.conditions[i].result) {
                existingTimer.conditions[i] = conditions[i];
            }
        }

        if (existingTimer.timedEntity) {
            // timer(s) ongoing
            if (timedCondition.id !== existingTimer.timedEntity.id) {
                const key = getKey(conditions);
                this.messaging.cancelCBTimeout(existingTimer.timerId, cancelTimeoutCallback);
                this.startTimer(key, ruleId, existingTimer);
                existingTimer.incomingData = incomingData;
            }
            existingTimer.entities = entities;
        } else {
            // no ongoing timers - clear it
            const key = getKey(conditions);
            this.clearTimer(ruleId, key);
        }
    }

    processDurations(
        combinations: Array<ProcessedCondition[]>,
        ruleParams: RuleParams,
        entities: Entities,
        actionTopic: string,
        incomingData: WithParsedCustomData,
    ): void {
        const ruleId = ruleParams.ruleID;
        if (!this.timerStore[ruleId]) {
            this.timerStore[ruleId] = {};
        }
        for (let i = 0; i < combinations.length; i++) {
            const key = getKey(combinations[i]);
            if (this.timerStore[ruleId][key]) {
                const existingTimer = this.timerStore[ruleId][key];
                const pickedEntities = pickEntities(combinations[i], entities);
                this.evaluateIncomingConditions(combinations[i], existingTimer, pickedEntities, ruleId, incomingData);
            } else {
                this.timerStore[ruleId][key] = buildTimerObject(
                    combinations[i],
                    entities,
                    actionTopic,
                    incomingData,
                    ruleParams,
                );
                this.startTimer(key, ruleId, this.timerStore[ruleId][key]);
            }
        }
    }
}

function createTimeoutCallback(err: boolean, msg: string): void {
    if (err) {
        log(`Error creating timeout: ${JSON.stringify(msg)}`);
    }
}

function cancelTimeoutCallback(err: boolean, msg: string): void {
    if (err) {
        log(`Error canceling timeout: ${JSON.stringify(msg)}`);
    }
}

function handleTrueCondition(incomingCondition: ProcessedCondition, existingTimer: Timer, idx: number): void {
    if (!existingTimer.conditions[idx].result) {
        existingTimer.conditions[idx] = {
            ...incomingCondition,
            timerStart: Date.now(),
        };
    }
    const remainingExistingTime =
        existingTimer.timedEntity.duration - (Date.now() - existingTimer.timedEntity.timerStart);
    const remainingIncomingTime =
        incomingCondition.duration && incomingCondition.duration - (Date.now() - incomingCondition.timerStart);
    if (remainingIncomingTime && (!existingTimer.timedEntity || remainingIncomingTime > remainingExistingTime)) {
        existingTimer.timedEntity = incomingCondition;
    }
}

function getKey(combination: ProcessedCondition[]): string {
    return combination.map(c => c.id).join('');
}

function pickEntities(combination: ProcessedCondition[], entities: Entities): Entities {
    return combination.reduce((acc: Entities, entity) => {
        if (!acc[entity.id]) {
            acc[entity.id] = entities[entity.id];
        }
        return acc;
    }, {});
}

function buildTimerObject(
    conditions: ProcessedCondition[],
    entities: Entities,
    actionTopic: string,
    incomingData: WithParsedCustomData,
    ruleParams: RuleParams,
): Timer {
    return {
        conditions,
        entities: pickEntities(conditions, entities),
        actionTopic,
        incomingData,
        ruleParams,
        timerId: '',
        timedEntity: {
            ...conditions[0],
            timerStart: Date.now(),
        },
    };
}
