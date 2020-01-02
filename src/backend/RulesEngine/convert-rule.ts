import {
    Condition,
    ConditionalOperators,
    OperatorAndValue,
    Entity,
    EntityTypes,
    GetOperatorAndValue,
    Relationship,
    Conditions,
    ConditionArray,
} from './types';
// import { AddDuration } from './duration';
import '../../static/promise-polyfill';
import { getAllAreasForType, getAllAssetsForType } from './async';
import { TopLevelCondition, AnyConditions, AllConditions, ConditionProperties } from 'json-rules-engine';

function createConditionsForEntity(entity: Entity): Promise<AnyConditions | undefined> {
    const rule: AnyConditions = {
        any: []
    }
    let promise;
    switch (entity.entity_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(entity.id).then(assets => {
                if (assets.length > 0) {
                    for (let i = 0; i < assets.length; i++) {
                        rule.any.push({
                            fact: 'id',
                            operator: 'equal',
                            value: assets[i].id as string,
                        });
                    }
                    return rule;
                }
            });
            Promise.runQueue();
            return promise;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(entity.id).then(areas => {
                if (areas.length > 0) {
                    for (let i = 0; i < areas.length; i++) {
                        rule.any.push({
                            fact: 'id',
                            operator: 'equal',
                            value: areas[i].id as string,
                        });
                    }
                    return rule;
                }
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(res => res());
    }
}

function createConditionsForAttribute(
    id: string,
    relationship: Relationship,
): Promise<AnyConditions | undefined> {
    const rule: AnyConditions = {
        any: []
    }
    let promise;
    switch (relationship.attribute_type) {
        case EntityTypes.ASSET_TYPE:
            promise = getAllAssetsForType(relationship.attribute).then(assets => {
                if (assets.length > 0) {
                    const rval: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value);
                    for (let i = 0; i < assets.length; i++) {
                        // AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id as string, relationship.duration);
                        rule.any.push({
                            fact: assets[i].id as string,
                            operator: rval.operator,
                            value: rval.value,
                        });
                    }
                    return rule;
                }
            });
            Promise.runQueue();
            return promise;
        case EntityTypes.AREA_TYPE:
            promise = getAllAreasForType(relationship.attribute).then(areas => {
                if (areas.length > 0) {
                    const rval2: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value);
                    for (let i = 0; i < areas.length; i++) {
                        // AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id as string, relationship.duration);
                        rule.any.push({
                            fact: areas[i].id as string,
                            operator: rval2.operator,
                            value: rval2.value,
                        });
                    }
                    return rule;
                }
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(res => res());
    }
}

function addSpecificEntityCondition(
    condition: Condition,
    rule: AllConditions,
): Promise<AllConditions> {
    if (
        condition.entity.entity_type === EntityTypes.ASSET ||
        condition.entity.entity_type === EntityTypes.AREA ||
        condition.entity.entity_type === EntityTypes.STATE
    ) {
        const entityCondition: ConditionProperties = {
            fact: 'id',
            operator: 'equal',
            value: (condition as Condition).entity.id,
        };        
        rule.all.push(entityCondition);
        return new Promise(res => res(rule));
    } else {
        const promise = createConditionsForEntity(condition.entity).then(
            entityCondition => {
                if (entityCondition) {                    
                    rule.all.push(entityCondition);
                }
                return rule;
            },
        );
        Promise.runQueue();
        return promise;
    }
}

function addANDConditions(
    id: string,
    condition: Condition,
): Promise<AllConditions> {
    const rule = {
        all: []
    }
    const promise: Promise<AllConditions> = addSpecificEntityCondition(condition, rule).then(
        rule => {
            if (
                condition.relationship.attribute_type === EntityTypes.ASSET ||
                condition.relationship.attribute_type === EntityTypes.AREA ||
                condition.relationship.attribute_type === EntityTypes.STATE
            ) {
                const rval: OperatorAndValue = GetOperatorAndValue(
                    condition.relationship.operator,
                    condition.relationship.value,
                );
                // AddDuration(
                //     ruleInfo.id,
                //     ruleInfo.id,
                //     (condition as Condition).relationship.attribute,
                //     (condition as Condition).relationship.duration,
                // );
                rule.all.push({
                    fact: condition.relationship.attribute,
                    operator: rval.operator,
                    value: rval.value,
                });
                return new Promise((res) => res(rule));
            } else {
                const promise = createConditionsForAttribute(
                    id,
                    condition.relationship,
                ).then(attributeCondition => {
                    if (attributeCondition) {                        
                        rule.all.push(attributeCondition);
                    }
                    return rule;
                })
                Promise.runQueue();
                return promise;
            }
        },
    )
    Promise.runQueue();
    return promise;
}

function convertANDCondition(
    id: string,
    condition: Condition | Conditions,
): Promise<AllConditions> {
    if ((condition as Condition).entity) {
        // We have a condition
        const promise = addANDConditions(id, condition as Condition);
        Promise.runQueue();
        return promise;
    } else {
        // Seems like we have nested conditions
        const promise = ParseAndConvertConditions(
            id,
            condition as Conditions,
        );
        Promise.runQueue();
        return promise as Promise<AllConditions>;
    }
}

function convertORCondition(
    id: string,
    condition: Condition | Conditions,
): Promise<AnyConditions | AllConditions> {
    if ((condition as Condition).entity) {
        // We have a condition        
        const promise = addANDConditions(
            id,
            condition as Condition,
        );
        Promise.runQueue();
        return promise;
    } else {
        // Seems like we have nested conditions        
        const promise = ParseAndConvertConditions(
            id,
            condition as Conditions,
        );
        Promise.runQueue();
        return promise as Promise<AnyConditions>;
    }
}

export function ParseAndConvertConditions(
    id: string,
    conditions: Conditions,
): Promise<TopLevelCondition | AnyConditions | AllConditions> {
    if (conditions.hasOwnProperty(ConditionalOperators.AND)) {
        const subConditions = conditions[ConditionalOperators.AND] as ConditionArray;
        const promise = Promise.all(subConditions.map(s => convertANDCondition(id, s))).then((rules) => {
            if (rules.length > 1) {
                return {
                    all: [...rules]
                }
            } else {
                return {
                    ...rules[0]
                }
            }
        }).catch((e) => {
            console.log('convertANDCondition error', e)
            return {} as TopLevelCondition
        });
        Promise.runQueue();
        return promise;
    } else {
        // is an OR
        const subConditions = conditions[ConditionalOperators.OR] as ConditionArray;
        const promise = Promise.all(subConditions.map(s => convertORCondition(id, s))).then((rules) => {
            if (rules.length > 1) {
                return {
                    any: [...rules]
                }
            } else {
                return {
                    ...rules[0]
                }
            }
        }).catch((e) => {
            return {} as TopLevelCondition
        });
        Promise.runQueue();
        return promise;
    }
}
