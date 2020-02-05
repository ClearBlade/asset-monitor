import { Almanac, TopLevelCondition, ConditionProperties } from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { ProcessedCondition, WithParsedCustomData, Entities } from './types';

/////////// for evaluating facts while engine is running

export interface FactData {
    data: WithParsedCustomData;
}

export function collectAndBuildFact(
    almanac: Almanac,
    id: string,
    type: string,
    collectionName: CollectionName,
    incomingData: WithParsedCustomData,
): Promise<FactData> {
    return new Promise(res => {
        const collection = CbCollectionLib(collectionName);
        const query = ClearBlade.Query({ collectionName });
        if (id === incomingData.id) {
            query.equalTo('id', id);
        } else {
            query.equalTo('type', type);
        }
        const promise = collection
            .cbFetchPromise({ query })
            .then((data: CbServer.CollectionFetchData<Asset | Areas>) => {
                let initialData; // the fact who started all this mess
                for (let i = 0; i < data.DATA.length; i++) {
                    const entityData = data.DATA[i];
                    const fact = buildFact(entityData, incomingData);
                    if (id === entityData.id) {
                        // if this one is the same as asset that triggered fact
                        initialData = { ...fact };
                    }
                    almanac.addRuntimeFact(entityData.id as string, { data: fact }); // add fact for id
                }
                res({ data: initialData } as FactData); // resolve the initial fact's value
            });
        Promise.runQueue();
        return promise;
    });
}

export function buildFact(entityData: Asset | Areas, incomingData: WithParsedCustomData): WithParsedCustomData {
    let withParsedCustomData: WithParsedCustomData = {
        // parse custom_data
        ...entityData,
        custom_data: JSON.parse((entityData.custom_data as string) || '{}'),
    };
    if (entityData.id === incomingData.id) {
        // if this one is the same as asset that triggered engine
        withParsedCustomData = {
            ...withParsedCustomData,
            ...incomingData,
            custom_data: {
                ...withParsedCustomData.custom_data,
                ...incomingData.custom_data,
            },
        };
    }
    return withParsedCustomData;
}

/////////// for processing rules after engine completes

type ProcessedRule = Array<ProcessedCondition[] | ProcessedCondition>;

export type ParentOperator = 'all' | 'any';

function buildProcessedCondition(fact: ConditionProperties): ProcessedCondition {
    return {
        id: (fact.params as Record<string, string>).id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include result
        result: fact.result,
        duration: (fact.params as Record<string, number>).duration,
        timerStart: 0,
    };
}

function isValidFact(fact: ConditionProperties): ProcessedCondition | undefined {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore json-rule-engine types does not include result
    if (fact.factResult) {
        return buildProcessedCondition(fact);
    }
}

function processFact(
    condition: ConditionProperties,
    processedLevel: ProcessedRule,
    parentOperator: ParentOperator,
): void {
    const validFact = isValidFact(condition);
    if (validFact) {
        processedLevel.push(
            parentOperator === 'all' ? (validFact as ProcessedCondition) : ([validFact] as ProcessedCondition[]),
        );
    }
}

function processAllCondition(
    condition: Array<TopLevelCondition | ConditionProperties>,
    processedLevel: ProcessedRule,
): void {
    const result = processRule(condition, 'all');
    if (Array.isArray(result[0])) {
        processedLevel.push(...result);
    } else {
        processedLevel.push(result as ProcessedCondition[]);
    }
}

function processAnyCondition(
    condition: Array<TopLevelCondition | ConditionProperties>,
    processedLevel: ProcessedRule,
): ProcessedRule {
    const result = processRule(condition, 'any');
    if (!processedLevel.length) {
        for (let j = 0; j < result.length; j++) {
            if (Array.isArray(result[j])) {
                processedLevel.push(result[j]);
            } else {
                processedLevel.push([result[j] as ProcessedCondition]);
            }
        }
    } else {
        const incomingprocessedLevel = [...processedLevel];
        processedLevel = [];
        for (let j = 0; j < result.length; j++) {
            for (let n = 0; n < incomingprocessedLevel.length; n++) {
                if (Array.isArray(incomingprocessedLevel[n])) {
                    processedLevel.push([
                        ...(incomingprocessedLevel[n] as ProcessedCondition[]),
                        ...(result[j] as ProcessedCondition[]),
                    ]);
                } else {
                    processedLevel.push([
                        incomingprocessedLevel[n] as ProcessedCondition,
                        ...(result[j] as ProcessedCondition[]),
                    ]);
                }
            }
        }
    }
    return processedLevel;
}

export function processRule(
    conditions: Array<TopLevelCondition | ConditionProperties>,
    parentOperator?: ParentOperator,
): ProcessedRule {
    let processedLevel: ProcessedRule = [];
    for (let i = 0; i < conditions.length; i++) {
        const operatorKey = Object.keys(conditions[i])[0];
        if (operatorKey === 'all') {
            processAllCondition(conditions[i][operatorKey as keyof TopLevelCondition], processedLevel);
        } else if (operatorKey === 'any') {
            processedLevel = processAnyCondition(conditions[i][operatorKey as keyof TopLevelCondition], processedLevel);
        } else {
            processFact(conditions[i] as ConditionProperties, processedLevel, parentOperator as ParentOperator);
        }
    }
    return processedLevel;
}

////////// for filtering only relevant conditions from results
// filter for events related to triggerId

// if 'any' search for combinations
// for trues, combine into one event of ids and fire and be done
// if no trues
// for *trues, send to duration processing

// if 'and' search for combinations
// for trues, group them, combine into one event of ids and fire
// for *trues, send each to duration processing

interface ProcessedFiltered {
    trues: string[];
    pendingDurations: ProcessedRule;
}

export function filterProcessedRule(processedRule: Array<ProcessedCondition[]>, triggerId: string): ProcessedFiltered {
    return processedRule.reduce(
        (filteredRule: ProcessedFiltered, combination) => {
            let hasId = false;
            let hasTrue = false;
            let hasDuration = false;
            let allTrue = true;
            for (let i = 0; i < combination.length; i++) {
                if (combination[i].id === triggerId) {
                    hasId = true;
                }
                if (combination[i].duration) {
                    hasDuration = true;
                }
                if (combination[i].result) {
                    hasTrue = true;
                } else {
                    allTrue = false;
                }
            }
            if (hasId) {
                if (allTrue && !hasDuration) {
                    filteredRule.trues.push(...combination.map(c => c.id));
                } else if (hasTrue && hasDuration) {
                    const sorted = combination.sort((a, b) => b.duration - a.duration);
                    filteredRule.pendingDurations.push(sorted as ProcessedCondition[]);
                }
            }
            return filteredRule;
        },
        {
            trues: [],
            pendingDurations: [],
        },
    );
}

export function uniqueArray(arr: string[]): string[] {
    const seen = {} as { [x: string]: boolean };
    return arr.filter(item => {
        return Object.prototype.hasOwnProperty.call(seen, item) ? false : (seen[item] = true);
    });
}

////////// grab data for assets/areas to send to event or duration processing

export function aggregateFactMap(processedRule: ProcessedFiltered, almanac: Almanac): Entities {
    const factMap = processedRule.trues.reduce((acc: Entities, id: string) => {
        if (!acc[id]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore json-rule-engine types does not include factMap
            acc[id] = almanac.factMap.get(id).value.data;
        }
        return acc;
    }, {});

    (processedRule.pendingDurations as Array<ProcessedCondition[]>).reduce((acc, combination) => {
        for (let i = 0; i < combination.length; i++) {
            if (!acc[combination[i].id]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i].id] = almanac.factMap.get(combination[i].id).value.data;
            }
        }
        return acc;
    }, factMap);

    return factMap;
}
