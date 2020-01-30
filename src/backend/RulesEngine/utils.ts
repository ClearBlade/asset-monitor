import { Almanac, TopLevelCondition, ConditionProperties } from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { EntityTypes, Condition } from './types';
import { Entities } from './async';

export interface WithParsedCustomData extends Asset {
    custom_data: Record<string, object>;
    entityType?: EntityTypes;
}

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

export function aggregateFactMap(almanac: Almanac, conditionIds: Array<ProcessedCondition[]>): Entities {
    return conditionIds.reduce((acc: Entities, combination: ProcessedCondition[]) => {
        for (let i = 0; i < combination.length; i++) {
            if (!acc[combination[i].id]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i].id] = almanac.factMap.get(combination[i].id).value.data;
            }
        }
        return acc;
    }, {});
}

// for processing rules after engine completes

interface ProcessedCondition {
    id: string;
    result: boolean;
    duration: number;
}

type ProcessedRule = Array<ProcessedCondition[] | ProcessedCondition>;

type ParentOperator = 'all' | 'any';

function buildProcessedCondition(fact: ConditionProperties): ProcessedCondition {
    return {
        id: (fact.params as Record<string, string>).id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include result
        result: fact.result,
        duration: (fact.params as Record<string, number>).duration,
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
