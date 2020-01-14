import { Condition, ConditionalOperators, EntityTypes, Conditions, ConditionArray } from './types';
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

function getConditionProps(id: string, condition: Condition, isPartOfType?: boolean): ConditionProperties {
    const { relationship, entity } = condition;
    switch (relationship.attribute_type) {
        case EntityTypes.STATE:
        default:
            return {
                fact: 'state',
                operator: relationship.operator,
                params: {
                    id,
                    attribute: relationship.attribute,
                    collection: getCollectionName(entity.entity_type),
                    type: isPartOfType ? entity.id : null,
                },
                path: `.data.custom_data.${relationship.attribute}`,
                value: relationship.value,
            };
    }
}

function formatConditionForEntity(
    entityId: string,
    condition: Condition,
    isPartOfType?: boolean,
): ConditionProperties[] {
    const { attribute_type } = condition.relationship;
    if (
        attribute_type === EntityTypes.ASSET ||
        attribute_type === EntityTypes.AREA ||
        attribute_type === EntityTypes.STATE
    ) {
        return [getConditionProps(entityId, condition, isPartOfType)];
    } else {
        // handle asset type and area type
        return [];
    }
}

function createConditionsForType(condition: Condition): Promise<ConditionProperties[]> {
    let promise;
    const conditions: ConditionProperties[] = [];
    switch (condition.entity.entity_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(condition.entity.id).then(assets => {
                if (assets.length > 0) {
                    for (let i = 0; i < assets.length; i++) {
                        conditions.push(...formatConditionForEntity(assets[i].id as string, condition, true));
                    }
                }
                return conditions;
            });
            Promise.runQueue();
            return promise;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(condition.entity.id).then(areas => {
                if (areas.length > 0) {
                    for (let i = 0; i < areas.length; i++) {
                        conditions.push(...formatConditionForEntity(areas[i].id as string, condition, true));
                    }
                }
                return conditions;
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(res => res(conditions));
    }
}

/////////////////////////////////////////////// SAVING THIS FOR ADDING PROPERTIES FOR AREA/PROX/OCC CONDITIONS WITH TYPES IN RELATIONSHIP
// function createConditionsForAttribute(
//     id: string,
//     relationship: Relationship,
// ): Promise<AnyConditions | undefined> {
//     const rule: AnyConditions = {
//         any: []
//     }
//     let promise;
//     switch (relationship.attribute_type) {
//         case EntityTypes.ASSET_TYPE:
//             promise = getAllAssetsForType(relationship.attribute).then(assets => {
//                 if (assets.length > 0) {
//                     const rval: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value);
//                     for (let i = 0; i < assets.length; i++) {
//                         // AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id as string, relationship.duration);
//                         rule.any.push({
//                             fact: assets[i].id as string,
//                             operator: rval.operator,
//                             value: rval.value,
//                         });
//                     }
//                     return rule;
//                 }
//             });
//             Promise.runQueue();
//             return promise;
//         case EntityTypes.AREA_TYPE:
//             promise = getAllAreasForType(relationship.attribute).then(areas => {
//                 if (areas.length > 0) {
//                     const rval2: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value);
//                     for (let i = 0; i < areas.length; i++) {
//                         // AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id as string, relationship.duration);
//                         rule.any.push({
//                             fact: areas[i].id as string,
//                             operator: rval2.operator,
//                             value: rval2.value,
//                         });
//                     }
//                     return rule;
//                 }
//             });
//             Promise.runQueue();
//             return promise;
//         default:
//             return new Promise(res => res());
//     }
// }

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
        rule.any.push(...formatConditionForEntity(condition.entity.id, condition));
        promise = new Promise(res => res(rule));
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
