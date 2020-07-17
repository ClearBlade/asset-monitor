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
require("@clearblade/promise-polyfill");
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
function calculateDuration(duration) {
    if (duration) {
        switch (duration.unit) {
            case types_1.DurationUnits.SECONDS:
                return duration.value * 1000;
            case types_1.DurationUnits.MINUTES:
                return duration.value * 60000;
            case types_1.DurationUnits.HOURS:
                return duration.value * 3600000;
            case types_1.DurationUnits.DAYS:
                return duration.value * 86400000;
            default:
                return 0;
        }
    }
    return 0;
}
function getLocationConditionProps(entityOne, entityTwo, operator, duration) {
    return {
        fact: 'entity',
        operator: operator,
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
function onFetchEntitiesForLocation(entities, id, entity, relationship, isPartOfType) {
    return entities.map(function (asset) {
        return getLocationConditionProps({
            id: id,
            collection: getCollectionName(entity.entity_type),
            type: isPartOfType ? entity.id : '',
        }, {
            id: asset.id,
            collection: getCollectionName(relationship.attribute_type),
            type: relationship.attribute,
        }, relationship.operator, relationship.duration);
    });
}
function getLocationConditions(id, condition, isPartOfType) {
    var relationship = condition.relationship, entity = condition.entity;
    var promise;
    if (relationship.attribute_type === types_1.EntityTypes.ASSET_TYPE) {
        promise = async_1.getAllAssetsForType(relationship.attribute).then(function (assets) {
            return onFetchEntitiesForLocation(assets, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    }
    else if (relationship.attribute_type === types_1.EntityTypes.AREA_TYPE) {
        promise = async_1.getAllAreasForType(relationship.attribute).then(function (areas) {
            return onFetchEntitiesForLocation(areas, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    }
    else if (relationship.attribute_type === types_1.EntityTypes.ASSET && relationship.attribute === '') {
        promise = async_1.getAllAssets().then(function (assets) {
            return onFetchEntitiesForLocation(assets, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    }
    else if (relationship.attribute_type === types_1.EntityTypes.AREA && relationship.attribute === '') {
        promise = async_1.getAllAreasForType(relationship.attribute).then(function (areas) {
            return onFetchEntitiesForLocation(areas, id, entity, relationship, isPartOfType);
        });
        Promise.runQueue();
        return promise;
    }
    else {
        return new Promise(function (res) {
            return res([
                getLocationConditionProps({
                    id: id,
                    collection: getCollectionName(entity.entity_type),
                    type: isPartOfType ? entity.id : '',
                }, {
                    id: relationship.attribute,
                    collection: getCollectionName(relationship.attribute_type),
                }, relationship.operator, relationship.duration),
            ]);
        });
    }
}
function getStateConditionProps(id, condition, isPartOfType) {
    var relationship = condition.relationship, entity = condition.entity;
    return new Promise(function (res) {
        res([
            {
                fact: 'entity',
                operator: relationship.operator,
                params: {
                    id: id,
                    attribute: relationship.attribute,
                    collection: getCollectionName(entity.entity_type),
                    type: isPartOfType ? entity.id : null,
                    duration: calculateDuration(relationship.duration),
                },
                path: ".data.custom_data." + relationship.attribute,
                value: relationship.value,
            },
        ]);
    });
}
function formatConditionForEntity(entityId, condition, isPartOfType) {
    var attribute_type = condition.relationship.attribute_type;
    if (attribute_type === types_1.EntityTypes.STATE) {
        return getStateConditionProps(entityId, condition, isPartOfType);
    }
    else {
        return getLocationConditions(entityId, condition, isPartOfType);
    }
}
function onFetchEntitiesForState(entities, condition, conditions, isPartOfType) {
    var promise = Promise.all(entities.map(function (entity) { return formatConditionForEntity(entity.id, condition, isPartOfType); })).then(function (results) {
        for (var i = 0; i < results.length; i++) {
            conditions.push.apply(conditions, results[i]);
        }
        return conditions;
    });
    Promise.runQueue();
    return promise;
}
function createConditionsForType(condition) {
    var promise;
    var conditions = [];
    switch (condition.entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(condition.entity.id).then(function (assets) {
                return onFetchEntitiesForState(assets, condition, conditions, true);
            });
            break;
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(condition.entity.id).then(function (areas) {
                return onFetchEntitiesForState(areas, condition, conditions, true);
            });
            break;
        case types_1.EntityTypes.ASSET:
            promise = async_1.getAllAssets().then(function (assets) {
                return onFetchEntitiesForState(assets, condition, conditions);
            });
            break;
        case types_1.EntityTypes.AREA:
            promise = async_1.getAllAreas().then(function (areas) {
                return onFetchEntitiesForState(areas, condition, conditions);
            });
            break;
        default:
            promise = new Promise(function (res) { return res(conditions); });
    }
    Promise.runQueue();
    return promise;
}
function addConditions(condition) {
    var rule = {
        any: [],
    };
    var promise;
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET_TYPE ||
        condition.entity.entity_type === types_1.EntityTypes.AREA_TYPE ||
        condition.entity.id === '' // wants all entities
    ) {
        promise = createConditionsForType(condition).then(function (entityConditions) {
            var _a;
            if (entityConditions.length) {
                (_a = rule.any).push.apply(_a, entityConditions);
            }
            return rule;
        });
    }
    else {
        promise = formatConditionForEntity(condition.entity.id, condition).then(function (condish) {
            return {
                any: __spreadArrays(condish),
            };
        });
    }
    Promise.runQueue();
    return promise;
}
function convertCondition(condition, parent) {
    if (condition.entity) {
        // We have a condition
        var promise = addConditions(condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions
        var promise = parseAndConvertConditions(condition, parent);
        Promise.runQueue();
        return promise;
    }
}
function parseAndConvertConditions(conditions, parent) {
    var level;
    var firstKey = Object.keys(conditions)[0];
    var subConditions = conditions[firstKey];
    var promise = Promise.all(subConditions.map(function (c) { return convertCondition(c, level); }))
        .then(function (rules) {
        if (rules.length > 1) {
            if (firstKey === 'or') {
                level = {
                    any: [],
                };
                rules.forEach(function (rule) {
                    var _a;
                    var operatorKey = Object.keys(rule)[0];
                    if (operatorKey === 'any') {
                        if (parent) {
                            parent.any.push(rule);
                        }
                        else {
                            (_a = level.any).push.apply(_a, rule.any);
                        }
                    }
                    else {
                        level.any.push(rule);
                    }
                });
                if (level.any.length) {
                    return level;
                }
            }
            else {
                return {
                    all: __spreadArrays(rules),
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
