import {
    Condition,
    ConditionalOperators,
    EntityTypes,
    Conditions,
    ConditionArray,
    Duration,
    DurationUnits,
    Relationship,
    Entity,
} from './types';
import '../../static/promise-polyfill';
import { getAllAreasForType, getAllAssetsForType, getAllAssets, getAllAreas } from './async';
import { TopLevelCondition, AnyConditions, AllConditions, ConditionProperties } from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';

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

function onFetchEntitiesForLocation(
    entities: CbServer.CollectionSchema<Asset | Areas>[],
    id: string,
    entity: Entity,
    relationship: Relationship,
    isPartOfType?: boolean,
): ConditionProperties[] {
    return entities.map(asset =>
        getLocationConditionProps(
            {
                id,
                collection: getCollectionName(entity.entity_type),
                type: isPartOfType ? entity.id : '',
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
}

function getLocationConditions(
    id: string,
    condition: Condition,
    isPartOfType?: boolean,
): Promise<ConditionProperties[]> {
    const { relationship, entity } = condition;
    let promise;
    if (relationship.attribute_type === EntityTypes.ASSET_TYPE) {
        promise = getAllAssetsForType(relationship.attribute).then(assets => {
            return onFetchEntitiesForLocation(assets, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    } else if (relationship.attribute_type === EntityTypes.AREA_TYPE) {
        promise = getAllAreasForType(relationship.attribute).then(areas => {
            return onFetchEntitiesForLocation(areas, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    } else if (relationship.attribute_type === EntityTypes.ASSET && relationship.attribute === '') {
        promise = getAllAssets().then(assets => {
            return onFetchEntitiesForLocation(assets, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    } else if (relationship.attribute_type === EntityTypes.AREA && relationship.attribute === '') {
        promise = getAllAreasForType(relationship.attribute).then(areas => {
            return onFetchEntitiesForLocation(areas, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    } else {
        return new Promise(res =>
            res([
                getLocationConditionProps(
                    {
                        id,
                        collection: getCollectionName(entity.entity_type),
                        type: isPartOfType ? entity.id : '',
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

function onFetchEntitiesForState(
    entities: CbServer.CollectionSchema<Asset | Areas>[],
    condition: Condition,
    conditions: ConditionProperties[],
    isPartOfType?: boolean,
): Promise<ConditionProperties[]> {
    const promise = Promise.all(
        entities.map(entity => formatConditionForEntity(entity.id as string, condition, isPartOfType)),
    ).then(results => {
        for (let i = 0; i < results.length; i++) {
            conditions.push(...results[i]);
        }
        return conditions;
    });
    Promise.runQueue();
    return promise;
}

function createConditionsForType(condition: Condition): Promise<ConditionProperties[]> {
    let promise;
    const conditions: ConditionProperties[] = [];
    switch (condition.entity.entity_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(condition.entity.id).then(assets => {
                return onFetchEntitiesForState(assets, condition, conditions, true);
            });
            break;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(condition.entity.id).then(areas => {
                return onFetchEntitiesForState(areas, condition, conditions, true);
            });
            break;
        case EntityTypes.ASSET:
            promise = getAllAssets().then(assets => {
                return onFetchEntitiesForState(assets, condition, conditions);
            });
            break;
        case EntityTypes.AREA:
            promise = getAllAreas().then(areas => {
                return onFetchEntitiesForState(areas, condition, conditions);
            });
            break;
        default:
            promise = new Promise(res => res(conditions));
    }
    Promise.runQueue();
    return promise as Promise<ConditionProperties[]>;
}

function addConditions(condition: Condition): Promise<AnyConditions | ConditionProperties> {
    const rule: AnyConditions = {
        any: [],
    };
    let promise;
    if (
        condition.entity.entity_type === EntityTypes.ASSET_TYPE ||
        condition.entity.entity_type === EntityTypes.AREA_TYPE ||
        condition.entity.id === '' // wants all entities
    ) {
        promise = createConditionsForType(condition).then(entityConditions => {
            if (entityConditions.length) {
                rule.any.push(...entityConditions);
            }
            return rule;
        });
    } else {
        promise = formatConditionForEntity(condition.entity.id, condition).then(condish => {
            return {
                any: [...(condish as ConditionProperties[])],
            };
        });
    }
    Promise.runQueue();
    return promise as Promise<AnyConditions>;
}

function convertCondition(
    condition: Condition | Conditions,
    parent: TopLevelCondition,
): Promise<AnyConditions | ConditionProperties> {
    if ((condition as Condition).entity) {
        // We have a condition
        const promise = addConditions(condition as Condition);
        Promise.runQueue();
        return promise;
    } else {
        // Seems like we have nested conditions
        const promise = parseAndConvertConditions(condition as Conditions, parent);
        Promise.runQueue();
        return promise as Promise<AnyConditions>;
    }
}

export function parseAndConvertConditions(
    conditions: Conditions,
    parent?: TopLevelCondition,
): Promise<TopLevelCondition | AnyConditions | AllConditions | ConditionProperties> {
    let level: TopLevelCondition;
    const firstKey = Object.keys(conditions)[0] as ConditionalOperators;
    const subConditions = conditions[firstKey] as ConditionArray;
    const promise = Promise.all(subConditions.map(c => convertCondition(c, level as TopLevelCondition)))
        .then(rules => {
            if (rules.length > 1) {
                if (firstKey === 'or') {
                    level = {
                        any: [],
                    };
                    rules.forEach(rule => {
                        const operatorKey = Object.keys(rule)[0];
                        if (operatorKey === 'any') {
                            if (parent) {
                                (parent as AnyConditions).any.push(rule);
                            } else {
                                (level as AnyConditions).any.push(...(rule as AnyConditions).any);
                            }
                        } else {
                            (level as AnyConditions).any.push(rule);
                        }
                    });
                    if ((level as AnyConditions).any.length) {
                        return level;
                    }
                } else {
                    return {
                        all: [...rules],
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
