import {
    Almanac,
    NestedCondition,
    TopLevelCondition,
    ConditionProperties,
    AllConditions,
    AnyConditions,
} from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { EntityTypes, RuleParams, StateParams } from './types';

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

interface ProcessedRule {
    conditionIds: Array<string[]>;
    hasDuration: boolean;
    hasSuccessfulResult: boolean;
}

function processRelevantFact(
    fact: ConditionProperties,
    processedRule: ProcessedRule,
    parentLength: number,
    parentOperator: 'any' | 'all',
): void {
    console.log('fact', fact);
    console.log('ids', processedRule.conditionIds);
    console.log('parentLength', parentLength);
    console.log('parentOp', parentOperator);
    const params = fact.params as Record<string, string>;
    // @ts-ignore json-rule-engine types does not include result
    if (fact.result) {
        processedRule.hasSuccessfulResult = true;
        for (let i = 0; i < processedRule.conditionIds.length; i++) {
            if (processedRule.conditionIds[i].indexOf(params.id) === -1) {
                processedRule.conditionIds[i].push(params.id);
            }
        }
        if (params.duration) {
            processedRule.hasDuration = true;
        }
    } else if (params.duration) {
        processedRule.hasDuration = true;
        for (let i = 0; i < processedRule.conditionIds.length; i++) {
            if (processedRule.conditionIds[i].indexOf(params.id) === -1) {
                processedRule.conditionIds[i].push(params.id);
            }
        }
    }
    console.log('fact processed', processedRule.conditionIds);
}

export function processRule(
    conditions: Array<TopLevelCondition | ConditionProperties>,
    processedRule: ProcessedRule,
    parentLength: number,
    parentOperator: 'any' | 'all',
): ProcessedRule {
    for (let i = 0; i < conditions.length; i++) {
        const firstKey = Object.keys(conditions[i])[0];
        if (firstKey === 'all') {
            processRule(
                conditions[i][firstKey as keyof TopLevelCondition],
                processedRule,
                (conditions[i][firstKey as keyof TopLevelCondition] as Array<TopLevelCondition | ConditionProperties>)
                    .length,
                'all',
            );
        } else if (firstKey === 'any') {
            processRule(
                conditions[i][firstKey as keyof TopLevelCondition],
                processedRule,
                (conditions[i][firstKey as keyof TopLevelCondition] as Array<TopLevelCondition | ConditionProperties>)
                    .length,
                'any',
            );
            // @ts-ignore json-rule-engine types does not include factResult
        } else if (conditions[i].factResult) {
            processRelevantFact(conditions[i] as ConditionProperties, processedRule, parentLength, parentOperator);
        } else {
            conditions.splice(i, 1);
        }
    }
    return processedRule;
}
