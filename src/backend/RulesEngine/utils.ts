import { Almanac, TopLevelCondition, ConditionProperties } from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Areas } from '../collection-schema/Areas';
import { EntityTypes } from './types';
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

export function aggregateFactMap(almanac: Almanac, conditionIds: Array<string[]>): Entities {
    return conditionIds.reduce((acc: Entities, combination: string[]) => {
        for (let i = 0; i < combination.length; i++) {
            if (!acc[combination[i]]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i]] = almanac.factMap.get(combination[i]).value.data;
            }
        }
        return acc;
    }, {});
}

// for processing rules after engine completes

interface ProcessedRule {
    conditionIds: Array<string[]>;
    hasDuration: boolean;
    hasSuccessfulResult: boolean;
    numValidCombination: number;
}

function isValidFact(fact: ConditionProperties, processedRule: ProcessedRule): string | undefined {
    const params = fact.params as Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore json-rule-engine types does not include result
    if (fact.factResult) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include result
        if (fact.result) {
            processedRule.hasSuccessfulResult = true;
            if (params.duration) {
                processedRule.hasDuration = true;
            }
            return params.id;
        } else if (params.duration) {
            processedRule.hasDuration = true;
            return params.id;
        }
    }
}

function validateAndFilterFacts(facts: ConditionProperties[], processedRule: ProcessedRule): string[] {
    const validIds = [];
    const factLength = facts.length;
    for (let i = factLength - 1; i >= 0; i--) {
        const validId = isValidFact(facts[i], processedRule);
        if (validId) {
            validIds.push(validId);
        } else {
            facts.pop();
        }
    }
    return validIds;
}

function processFacts(facts: ConditionProperties[], processedRule: ProcessedRule, parentOperator: 'all' | 'any'): void {
    const validIds = validateAndFilterFacts(facts, processedRule);
    if (parentOperator === 'all') {
        if (!processedRule.conditionIds.length) {
            processedRule.conditionIds = [validIds];
            processedRule.numValidCombination = processedRule.conditionIds[0].length;
        } else {
            for (let i = 0; i < validIds.length; i++) {
                for (let j = 0; j < processedRule.conditionIds.length; j++) {
                    processedRule.conditionIds[j].push(validIds[i]);
                    if (processedRule.conditionIds[j].length > processedRule.numValidCombination) {
                        processedRule.numValidCombination = processedRule.conditionIds[j].length;
                    }
                }
            }
        }
    } else {
        if (!processedRule.conditionIds.length) {
            processedRule.conditionIds = validIds.map(id => [id]);
            processedRule.numValidCombination = validIds.length ? 1 : 0;
        } else {
            for (let k = 0; k < validIds.length; k++) {
                const idsLength = processedRule.conditionIds.length;
                for (let n = 0; n < idsLength; n++) {
                    if (k === 0) {
                        processedRule.conditionIds[n].push(validIds[k]);
                    } else {
                        const modified = [...processedRule.conditionIds[n]];
                        modified[modified.length - 1] = validIds[k];
                        processedRule.conditionIds.push(modified);
                    }
                    if (processedRule.conditionIds[n].length > processedRule.numValidCombination) {
                        processedRule.numValidCombination = processedRule.conditionIds[n].length;
                    }
                }
            }
        }
    }
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
        if (operatorKey === 'all' || operatorKey === 'any') {
            processRule(conditions[i][operatorKey as keyof TopLevelCondition], processedRule, operatorKey);
        } else {
            processFacts(conditions as ConditionProperties[], processedRule, parentOperator);
            break;
        }
    }
    processedRule.conditionIds.map(array => array.sort());
    return processedRule;
}
