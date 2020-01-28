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

type ProcessedRule = Array<ProcessedCondition[]>;

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

function validateAndFilterFacts(facts: ConditionProperties[]): ProcessedCondition[] {
    const validIds = [];
    const factLength = facts.length;
    for (let i = factLength - 1; i >= 0; i--) {
        const validId = isValidFact(facts[i]);
        if (validId) {
            validIds.push(validId);
        } else {
            facts.pop();
        }
    }
    return validIds;
}

function processFacts(facts: ConditionProperties[], processedRule: ProcessedRule, parentOperator: 'all' | 'any'): void {
    console.log('facts', facts);
    console.log('parent op', parentOperator);
    console.log('pre processed facts', processedRule);
    const validIds = validateAndFilterFacts(facts);
    if (parentOperator === 'all') {
        if (!processedRule.length) {
            processedRule = [validIds];
        } else {
            for (let i = 0; i < validIds.length; i++) {
                for (let j = 0; j < processedRule.length; j++) {
                    processedRule[j].push(validIds[i]);
                }
            }
        }
    } else {
        if (!processedRule.length) {
            processedRule = validIds.map(id => [id]);
        } else {
            for (let k = 0; k < validIds.length; k++) {
                const idsLength = processedRule.length;
                for (let n = 0; n < idsLength; n++) {
                    if (k === 0) {
                        processedRule[n].push(validIds[k]);
                    } else {
                        const modified = [...processedRule[n]];
                        modified[modified.length - 1] = validIds[k];
                        processedRule.push(modified);
                    }
                }
            }
        }
    }
    console.log('post process facts', processedRule);
}

export function processRule(
    conditions: Array<TopLevelCondition | ConditionProperties>,
    processedRule: ProcessedRule,
    parentOperator: 'any' | 'all',
): ProcessedRule {
    for (let i = 0; i < conditions.length; i++) {
        const operatorKey = conditions[i]['any' as keyof TopLevelCondition]
            ? 'any'
            : conditions[i]['all' as keyof TopLevelCondition]
            ? 'all'
            : '';
        if (operatorKey === 'all') {
            processRule(conditions[i][operatorKey as keyof TopLevelCondition], processedRule, operatorKey);
        } else if (operatorKey === 'any') {
            for (let j = 0; j < conditions[i][operatorKey as keyof TopLevelCondition].length; j++) {
                processedRule.push([]);
            }
            processRule(conditions[i][operatorKey as keyof TopLevelCondition], processedRule, operatorKey);
        } else {
            processFacts(conditions as ConditionProperties[], processedRule, parentOperator);
            break;
        }
    }
    return processedRule;
}
