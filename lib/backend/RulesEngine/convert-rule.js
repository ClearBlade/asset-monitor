"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
require("../../static/promise-polyfill");
var async_1 = require("./async");
function getCollectionName(entityType) {
    switch (entityType) {
        case types_1.EntityTypes.ASSET_TYPE:
            return types_1.EntityTypes.ASSET;
        case types_1.EntityTypes.AREA_TYPE:
            return types_1.EntityTypes.AREA;
        default:
            return entityType;
    }
}
function getConditionProps(id, condition, isPartOfType) {
    var relationship = condition.relationship, entity = condition.entity;
    switch (relationship.attribute_type) {
        case types_1.EntityTypes.STATE:
        default:
            return {
                fact: 'state',
                operator: relationship.operator,
                params: {
                    id: id,
                    attribute: relationship.attribute,
                    collection: getCollectionName(entity.entity_type),
                    type: isPartOfType ? entity.id : null,
                },
                path: ".data.custom_data." + relationship.attribute,
                value: relationship.value,
            };
    }
}
function formatConditionForEntity(entityId, condition, isPartOfType) {
    var attribute_type = condition.relationship.attribute_type;
    if (attribute_type === types_1.EntityTypes.ASSET ||
        attribute_type === types_1.EntityTypes.AREA ||
        attribute_type === types_1.EntityTypes.STATE) {
        return [getConditionProps(entityId, condition, isPartOfType)];
    }
    else {
        // handle asset type and area type
        return [];
    }
}
function createConditionsForType(condition) {
    var promise;
    var conditions = [];
    switch (condition.entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(condition.entity.id).then(function (assets) {
                if (assets.length > 0) {
                    for (var i = 0; i < assets.length; i++) {
                        conditions.push.apply(conditions, formatConditionForEntity(assets[i].id, condition, true));
                    }
                }
                return conditions;
            });
            Promise.runQueue();
            return promise;
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(condition.entity.id).then(function (areas) {
                if (areas.length > 0) {
                    for (var i = 0; i < areas.length; i++) {
                        conditions.push.apply(conditions, formatConditionForEntity(areas[i].id, condition, true));
                    }
                }
                return conditions;
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(function (res) { return res(conditions); });
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
function addConditions(ruleId, condition) {
    var _a;
    var rule = {
        any: [],
    };
    var promise;
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET_TYPE ||
        condition.entity.entity_type === types_1.EntityTypes.AREA_TYPE) {
        promise = createConditionsForType(condition).then(function (entityConditions) {
            var _a;
            if (entityConditions.length) {
                (_a = rule.any).push.apply(_a, entityConditions);
            }
            return rule;
        });
    }
    else {
        (_a = rule.any).push.apply(_a, formatConditionForEntity(condition.entity.id, condition));
        promise = new Promise(function (res) { return res(rule); });
    }
    Promise.runQueue();
    return promise;
}
function convertCondition(ruleId, condition) {
    if (condition.entity) {
        // We have a condition
        var promise = addConditions(ruleId, condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions
        var promise = parseAndConvertConditions(ruleId, condition);
        Promise.runQueue();
        return promise;
    }
}
function parseAndConvertConditions(ruleId, conditions) {
    var firstKey = Object.keys(conditions)[0];
    var subConditions = conditions[firstKey];
    var promise = Promise.all(subConditions.map(function (s) { return convertCondition(ruleId, s); }))
        .then(function (rules) {
        if (rules.length > 1) {
            if (firstKey === 'and') {
                return {
                    all: __spreadArrays(rules),
                };
            }
            else {
                return {
                    any: __spreadArrays(rules),
                };
            }
        }
        return __assign({}, rules[0]);
    })
        .catch(function (e) {
        console.log('convertCondition error', e);
        return {};
    });
    Promise.runQueue();
    return promise;
}
exports.parseAndConvertConditions = parseAndConvertConditions;
