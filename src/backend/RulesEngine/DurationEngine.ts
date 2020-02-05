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

export class DurationEngine {
    timerStore: Timers;
    constructor() {
        this.timerStore = {};
    }

    clearTimersForRule(ruleId: string): void {
        // TODO: loop through and clear each actual timer
        if (this.timerStore[ruleId]) {
            delete this.timerStore[ruleId];
        }
    }

    clearTimer(ruleId: string, key: string): void {
        if (this.timerStore[ruleId] && this.timerStore[ruleId][key]) {
            // TODO: clear actual timer
            delete this.timerStore[ruleId][key];
        }
    }

    timerExecuted(ruleId: string, key: string): void {
        const { conditions, entities, actionTopic, incomingData, ruleParams } = this.timerStore[ruleId][key];
        const ids = [];
        for (let i = 0; i < conditions.length; i++) {
            if (!conditions[i].result) {
                this.clearTimer(ruleId, key);
            } else {
                ids.push(conditions[i].id);
            }
        }
        processSuccessfulEvent(ids, ruleParams, entities, actionTopic, incomingData);
        if (ruleParams.ruleType === 'any') {
            this.clearTimersForRule(ruleParams.ruleID);
        }
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
                handleTrueCondition(conditions[i], existingTimer, i); // may update existingTimer
            } else if (existingTimer.conditions[i].result) {
                existingTimer.conditions[i] = conditions[i];
            }
        }

        if (existingTimer.timedEntity) {
            if (timedCondition.id !== existingTimer.timedEntity.id) {
                // clear actual timer of existing timer id
                // create and invoke new timer function with timeout set for duration - (Date.now() - timerStart)
                // assign new timer id to existingTimer.timerId
                existingTimer.incomingData = incomingData;
            }
            existingTimer.entities = entities;
        } else {
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
            }
        }
    }
}

function handleTrueCondition(incomingCondition: ProcessedCondition, existingTimer: Timer, idx: number): void {
    if (!existingTimer.conditions[idx].result) {
        existingTimer.conditions[idx] = {
            ...incomingCondition,
            timerStart: Date.now(),
        };
    }
    const remainingTime = existingTimer.timedEntity.duration - (Date.now() - existingTimer.timedEntity.timerStart);
    if (incomingCondition.duration && (!existingTimer.timedEntity || incomingCondition.duration > remainingTime)) {
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
    const timerId = uuid();
    return {
        conditions,
        entities: pickEntities(conditions, entities),
        actionTopic,
        incomingData,
        ruleParams,
        timerId,
        timedEntity: conditions[0],
    };
}
