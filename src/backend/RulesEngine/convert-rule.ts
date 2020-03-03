import {
    Condition,
    ConditionalOperators,
    EntityTypes,
    Conditions,
    ConditionArray,
    Duration,
    DurationUnits,
} from './types';
import '../../static/promise-polyfill';
import { getAllAreasForType, getAllAssetsForType } from './async';
import { TopLevelCondition, AnyConditions, AllConditions, ConditionProperties } from 'json-rules-engine';

function getCollectionName(entityType: EntityTypes): EntityTypes {
    switch (entityType) {
        case EntityTypes.ASSET_TYPE:
            return EntityTypes.ASSET;
        case EntityTypes.AREA_TYPE:
            return EntityTypes.AREA;
        default:
            return entityType as EntityTypes;
    }
}

function calculateDuration(duration: Duration): number {
    if (duration) {
        switch (duration.unit) {
            case DurationUnits.SECONDS:
                return duration.value * 1000;
            case DurationUnits.MINUTES:
                return duration.value * 60000;
            case DurationUnits.HOURS:
                return duration.value * 3600000;
            case DurationUnits.DAYS:
                return duration.value * 86400000;
            default:
                return 0;
        }
    }
    return 0;
}

interface LocationEntityInfo {
    id: string;
    collection: EntityTypes;
    type?: string;
}

function getLocationConditionProps(
    entityOne: LocationEntityInfo,
    entityTwo: LocationEntityInfo,
    operator: string,
    duration: Duration,
): ConditionProperties {
    return {
        fact: 'entity',
        operator,
        params: {
            id: entityOne.id,
            collection: entityOne.collection,
            type: entityOne.type,
            duration: calculateDuration(duration),
        },
        value: {
            fact: 'entity',
            params: {
                id: entityTwo.id,
                collection: entityTwo.collection,
                type: entityTwo.type,
            },
        },
    };
}

function getLocationConditions(
    id: string,
    condition: Condition,
    isPartOfType?: boolean,
): Promise<ConditionProperties[]> {
    const { relationship, entity } = condition;
    let promise;
    switch (relationship.attribute_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(relationship.attribute).then(assets => {
                return assets.map(asset =>
                    getLocationConditionProps(
                        {
                            id,
                            collection: getCollectionName(entity.entity_type),
                            type: isPartOfType ? entity.id : undefined,
                        },
                        {
                            id: asset.id as string,
                            collection: getCollectionName(relationship.attribute_type),
                            type: relationship.attribute,
                        },
                        relationship.operator,
                        relationship.duration,
                    ),
                );
            });
            Promise.runQueue();
            return promise;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(relationship.attribute).then(areas => {
                return areas.map(area =>
                    getLocationConditionProps(
                        {
                            id,
                            collection: getCollectionName(entity.entity_type),
                            type: isPartOfType ? entity.id : undefined,
                        },
                        {
                            id: area.id as string,
                            collection: getCollectionName(relationship.attribute_type),
                            type: relationship.attribute,
                        },
                        relationship.operator,
                        relationship.duration,
                    ),
                );
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(res =>
                res([
                    getLocationConditionProps(
                        {
                            id,
                            collection: getCollectionName(entity.entity_type),
                            type: isPartOfType ? entity.id : undefined,
                        },
                        {
                            id: relationship.attribute,
                            collection: getCollectionName(relationship.attribute_type),
                        },
                        relationship.operator,
                        relationship.duration,
                    ),
                ]),
            );
    }
}

function getStateConditionProps(
    id: string,
    condition: Condition,
    isPartOfType?: boolean,
): Promise<ConditionProperties[]> {
    const { relationship, entity } = condition;
    return new Promise(res => {
        res([
            {
                fact: 'entity',
                operator: relationship.operator,
                params: {
                    id,
                    attribute: relationship.attribute,
                    collection: getCollectionName(entity.entity_type),
                    type: isPartOfType ? entity.id : null,
                    duration: calculateDuration(relationship.duration),
                },
                path: `.data.custom_data.${relationship.attribute}`,
                value: relationship.value,
            },
        ]);
    });
}

function formatConditionForEntity(
    entityId: string,
    condition: Condition,
    isPartOfType?: boolean,
): Promise<ConditionProperties[]> {
    const { attribute_type } = condition.relationship;
    if (attribute_type === EntityTypes.STATE) {
        return getStateConditionProps(entityId, condition, isPartOfType);
    } else {
        return getLocationConditions(entityId, condition, isPartOfType);
    }
}

function createConditionsForType(condition: Condition): Promise<ConditionProperties[]> {
    let promise;
    const conditions: ConditionProperties[] = [];
    switch (condition.entity.entity_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(condition.entity.id).then(assets => {
                const promiseTwo = Promise.all(
                    assets.map(asset => formatConditionForEntity(asset.id as string, condition, true)),
                ).then(results => {
                    for (let i = 0; i < results.length; i++) {
                        conditions.push(...results[i]);
                    }
                    return conditions;
                });
                Promise.runQueue();
                return promiseTwo;
            });
            break;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(condition.entity.id).then(areas => {
                const promiseTwo = Promise.all(
                    areas.map(area => formatConditionForEntity(area.id as string, condition, true)),
                ).then(results => {
                    for (let i = 0; i < results.length; i++) {
                        conditions.push(...results[i]);
                    }
                    return conditions;
                });
                Promise.runQueue();
                return promiseTwo;
            });
            break;
        default:
            promise = new Promise(res => res(conditions));
    }
    Promise.runQueue();
    return promise as Promise<ConditionProperties[]>;
}

function addConditions(ruleId: string, condition: Condition): Promise<AnyConditions> {
    const rule: AnyConditions = {
        any: [],
    };
    let promise;
    if (
        condition.entity.entity_type === EntityTypes.ASSET_TYPE ||
        condition.entity.entity_type === EntityTypes.AREA_TYPE
    ) {
        promise = createConditionsForType(condition).then(entityConditions => {
            if (entityConditions.length) {
                rule.any.push(...entityConditions);
            }
            return rule;
        });
    } else {
        promise = formatConditionForEntity(condition.entity.id, condition).then(condish => {
            rule.any.push(...condish);
            return rule;
        });
    }
    Promise.runQueue();
    return promise as Promise<AnyConditions>;
}

function convertCondition(ruleId: string, condition: Condition | Conditions): Promise<AnyConditions> {
    if ((condition as Condition).entity) {
        // We have a condition
        const promise = addConditions(ruleId, condition as Condition);
        Promise.runQueue();
        return promise;
    } else {
        // Seems like we have nested conditions
        const promise = parseAndConvertConditions(ruleId, condition as Conditions);
        Promise.runQueue();
        return promise as Promise<AnyConditions>;
    }
}

export function parseAndConvertConditions(
    ruleId: string,
    conditions: Conditions,
): Promise<TopLevelCondition | AnyConditions | AllConditions> {
    const firstKey = Object.keys(conditions)[0] as ConditionalOperators;
    const subConditions = conditions[firstKey] as ConditionArray;
    const promise = Promise.all(subConditions.map(s => convertCondition(ruleId, s)))
        .then(rules => {
            if (rules.length > 1) {
                if (firstKey === 'and') {
                    return {
                        all: [...rules],
                    };
                } else {
                    return {
                        any: [...rules],
                    };
                }
            }
            return {
                ...rules[0],
            };
        })
        .catch(e => {
            console.log('convertCondition error', e);
            return {} as TopLevelCondition;
        });
    Promise.runQueue();
    return promise;
}
