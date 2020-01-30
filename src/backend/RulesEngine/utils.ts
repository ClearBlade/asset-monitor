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

function processAllFacts(facts: ConditionProperties[], processedRule: ProcessedRule): ProcessedRule {
    const processedFacts: ProcessedCondition[] = [];
    for (let i = 0; i < facts.length; i++) {
        const fact: ConditionProperties = facts[i];
        const processedFact = isValidFact(fact);
        if (processedFact) {
            // if (!processedRule.length) {
            //     processedRule.push([processedFact]);
            // } else {
            //     for (let j = 0; j < processedRule.length; j++) {
            //         processedRule[j].push(processedFact);
            //     }
            // }
            processedFacts.push(processedFact);
        }
    }
    processedRule.push(processedFacts);
    return processedRule;
}

function processAnyFacts(facts: ConditionProperties[], processedRule: ProcessedRule): ProcessedRule {
    const isRoot = !processedRule.length;
    const numCombinations = processedRule.length;
    for (let i = 0; i < facts.length; i++) {
        const fact: ConditionProperties = facts[i];
        const processedFact = isValidFact(fact);
        if (processedFact) {
            if (isRoot) {
                processedRule.push([processedFact]);
            } else {
                for (let n = 0; n < numCombinations; n++) {
                    if (i === 0) {
                        processedRule[n].push(processedFact);
                    } else {
                        const modified = [...processedRule[n]];
                        modified[modified.length - 1] = processedFact;
                        processedRule.push(modified);
                    }
                }
            }
        }
    }
    return processedRule;
}

function processFacts(facts: ConditionProperties[]): ProcessedCondition[] {
    const processedFacts = [];
    for (let i = 0; i < facts.length; i++) {
        const valid = isValidFact(facts[i]);
        if (valid) {
            processedFacts.push(valid);
        }
    }
    return processedFacts;
}

export function processCondition(
    conditions: Array<TopLevelCondition | ConditionProperties>,
    processedRule: ProcessedRule,
    parentOperator: ParentOperator,
): ProcessedRule {
    for (let i = 0; i < conditions.length; i++) {
        const operatorKey = Object.keys(conditions[i])[0];
        if (operatorKey === 'all') {
            console.log('about to process all', conditions[i]);
            console.log('about to process all', processedRule);
            const result = processCondition(
                conditions[i][operatorKey as keyof TopLevelCondition],
                [...processedRule],
                'all',
            );
            console.log('WHAMMYYY', result);
            console.log('WHAMMYYY', processedRule);
            if (processedRule.length) {
                processedRule.push(result);
            } else if (Array.isArray(result[0])) {
                processedRule.push(...result);
            } else {
                processedRule.push([...result]);
            }
            console.log('processed all', JSON.stringify(processedRule));
        } else if (operatorKey === 'any') {
            console.log('about to process any', conditions[i]);
            console.log('about to process any', processedRule);
            const result = processCondition(
                conditions[i][operatorKey as keyof TopLevelCondition],
                [...processedRule],
                'any',
            );
            console.log('did all the aall stuff', result);
            if (!processedRule.length) {
                processedRule = result.map(r => {
                    if (Array.isArray(r)) {
                        return [...r];
                    } else {
                        return [r];
                    }
                });
            } else {
                const numCombinations = processedRule.length;
                for (let j = 0; j < result.length; j++) {
                    for (let n = 0; n < numCombinations; n++) {
                        if (j === 0) {
                            processedRule[n].push(result[j]);
                        } else {
                            const modified = [...processedRule[n]];
                            modified[modified.length - 1] = result[j];
                            processedRule.push(modified);
                        }
                    }
                }
            }
            console.log('processed any', processedRule);
        } else {
            if (parentOperator === 'all') {
                processedRule = processFacts(conditions as ConditionProperties[]);
                console.log('processed all facts', processedRule);
            } else {
                processedRule = processFacts(conditions as ConditionProperties[]);
                console.log('processed any facts', processedRule);
            }
            break;
        }
    }
    console.log('processed condition before returning', processedRule);
    return processedRule;
}

export function processRule(conditions: TopLevelCondition): ProcessedRule {
    const operatorKey = Object.keys(conditions)[0];
    const processedRule = [
        ...processCondition(conditions[operatorKey as keyof TopLevelCondition], [], operatorKey as ParentOperator),
    ];
    console.log('returning processed rule', processedRule);
    return processedRule;
}
