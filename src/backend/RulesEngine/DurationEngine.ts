import { RuleParams, ProcessedCondition, WithParsedCustomData, Entities } from './types';
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

export interface Timers {
    [x: string]: Timer;
}

export const DURATION_TOPIC = 'rule_duration_reached';
const DURATION_CACHE = 'rule_duration_cache';

export class DurationEngine {
    private static _instance: DurationEngine;

    timerCache: CbServer.Cache<Timers>;
    messaging: CbServer.Messaging;

    constructor(timerCache = ClearBlade.Cache(DURATION_CACHE) as CbServer.Cache<Timers>) {
        this.timerCache = timerCache;
        this.messaging = ClearBlade.Messaging();
    }

    static getInstance(): DurationEngine {
        if (!DurationEngine._instance) {
            DurationEngine._instance = new DurationEngine();
        }
        return DurationEngine._instance;
    }

    getCacheHandler(ruleId: string, callback: (data: Timers) => void): void {
        this.timerCache.get(ruleId, (err, data) => {
            if (err) {
                log(`Error getting cache for rule: ${ruleId}`);
            } else {
                callback(data ? { ...data } : {});
            }
        });
    }

    clearTimersForRule(ruleId: string): void {
        this.getCacheHandler(ruleId, data => {
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                const timer = data[keys[i]];
                this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            }
            this.timerCache.delete(ruleId, deleteCacheCallback);
        });
    }

    clearTimer(ruleId: string, key: string): void {
        this.getCacheHandler(ruleId, data => {
            const timer = data[key];
            this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            delete data[key];
            if (!Object.keys(data).length) {
                this.timerCache.delete(ruleId, deleteCacheCallback);
            } else {
                this.timerCache.set(ruleId, data, setCacheCallback);
            }
        });
    }

    timerExecuted(err: boolean, data: string | null): void {
        if (data) {
            const { userData } = JSON.parse(data as string);
            const { key, ruleId } = JSON.parse(userData);

            this.getCacheHandler(ruleId, data => {
                const { conditions, entities, actionTopic, incomingData, ruleParams } = data[key];
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
                    this.clearTimersForRule(ruleId);
                } else {
                    this.clearTimer(ruleId, key);
                }
            });
        }
    }

    async startTimerAndGetId(key: string, ruleId: string, timer: Timer): Promise<string> {
        const data = JSON.stringify({
            ruleId,
            key,
        });
        return new Promise((res, rej) => {
            this.messaging.setTimeout(timer.timedEntity.duration, DURATION_TOPIC, data, (err, msg) => {
                if (err) {
                    log(`Error creating timeout: ${JSON.stringify(msg)}`);
                    rej();
                } else {
                    res(msg);
                }
            });
        });
    }

    async modifyTimer(
        conditions: ProcessedCondition[],
        existingTimer: Timer,
        entities: Entities,
        ruleId: string,
        incomingData: WithParsedCustomData,
    ): Promise<Timer> {
        const timedCondition = (conditions.filter(
            c => c.id === existingTimer.timedEntity.id,
        ) as ProcessedCondition[])[0];
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
                this.startTimerAndGetId(key, ruleId, existingTimer).then(timerId => {
                    return {
                        ...existingTimer,
                        timerId,
                        incomingData,
                        entities,
                    };
                });
                Promise.runQueue();
            }
            return new Promise(res => {
                res({
                    ...existingTimer,
                    entities,
                });
            });
        } else {
            // no ongoing timers - clear it
            const key = getKey(conditions);
            this.clearTimer(ruleId, key);
            return new Promise(res => {
                res({ ...existingTimer });
            });
        }
    }

    async evaluateIncomingCombination(
        combination: ProcessedCondition[],
        ruleParams: RuleParams,
        timer: Timer,
        key: string,
        entities: Entities,
        actionTopic: string,
        incomingData: WithParsedCustomData,
    ): Promise<Timer> {
        if (timer) {
            const pickedEntities = pickEntities(combination, entities);
            return this.modifyTimer(combination, timer, pickedEntities, ruleParams.ruleID, incomingData);
        } else {
            const timerObj = buildTimerObject(combination, entities, actionTopic, incomingData, ruleParams);
            const promise = this.startTimerAndGetId(key, ruleParams.ruleID, timerObj).then(timerId => {
                return {
                    ...timerObj,
                    timerId,
                };
            });
            Promise.runQueue();
            return promise;
        }
    }

    async processDurations(
        combinations: Array<ProcessedCondition[]>,
        ruleParams: RuleParams,
        entities: Entities,
        actionTopic: string,
        incomingData: WithParsedCustomData,
    ): Promise<void> {
        const ruleId = ruleParams.ruleID;
        this.getCacheHandler(ruleId, data => {
            return Promise.all(
                combinations.map(c => {
                    const key = getKey(c);
                    this.evaluateIncomingCombination(
                        c,
                        ruleParams,
                        data[key],
                        key,
                        entities,
                        actionTopic,
                        incomingData,
                    ).then(newTimer => {
                        data[key] = newTimer;
                    });
                }),
            ).then(() => {
                return this.timerCache.set(ruleId, data, setCacheCallback);
            });
        });
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

function setCacheCallback(err: boolean, msg: string): void {
    if (err) {
        log(`Error setting cache for rule: ${JSON.stringify(msg)}`);
    }
}

function deleteCacheCallback(err: boolean, msg: string): void {
    if (err) {
        log(`Error deleting cache for rule: ${JSON.stringify(msg)}`);
    }
}

function cancelTimeoutCallback(err: boolean, msg: string): void {
    if (err) {
        log(`Error canceling timeout: ${JSON.stringify(msg)}`);
    }
}
