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
// import { AddDuration } from './duration';
require("../../static/promise-polyfill");
var async_1 = require("./async");
<<<<<<< HEAD
<<<<<<< HEAD
function ParseAndConvertConditions(ruleInfo, rule, conditions) {
    if (conditions.hasOwnProperty('and')) {
        rule[types_1.RulesEngineConditionalOperators.AND] = [];
        var subConditions = conditions[types_1.ConditionalOperators.AND];
        var promise = Promise.all(subConditions.map(function (s) { return convertANDCondition(ruleInfo, rule, s); })).then(function () {
            return rule;
        });
        // @ts-ignore
        Promise.runQueue();
        return promise;
    }
    else { // is an OR
        rule[types_1.RulesEngineConditionalOperators.OR] = [];
        var subConditions = conditions[types_1.ConditionalOperators.OR];
        var promise = Promise.all(subConditions.map(function (s) { return convertORCondition(ruleInfo, rule, s); })).then(function () {
            return rule;
        });
        // @ts-ignore
        Promise.runQueue();
        return promise;
    }
}
exports.ParseAndConvertConditions = ParseAndConvertConditions;
<<<<<<< HEAD
function convertANDConditions(ruleInfo, rule, conditions) {
    var subConditions = conditions[types_1.ConditionalOperators.AND];
    for (var i = 0; i < subConditions.length; i++) {
        var condition = subConditions[i];
        if (condition.hasOwnProperty('entity')) {
            // We have a condition
            if (condition.entity.entity_type === types_1.EntityTypes.ASSET ||
                condition.entity.entity_type === types_1.EntityTypes.AREA ||
                condition.entity.entity_type === types_1.EntityTypes.STATE) {
                var entityCondition = {
                    fact: 'id',
                    operator: 'equal',
                    value: condition.entity.id,
                };
                rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
            }
            else {
                var entityCondition = {};
                if (createConditionsForEntity(entityCondition, condition.entity)) {
                    rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
                }
            }
            if (condition.relationship.attribute_type === types_1.EntityTypes.ASSET ||
                condition.relationship.attribute_type === types_1.EntityTypes.AREA ||
                condition.relationship.attribute_type === types_1.EntityTypes.STATE) {
                var rval = types_1.GetOperatorAndValue(condition.relationship.operator, condition.relationship.value);
                duration_1.AddDuration(ruleInfo.id, ruleInfo.id, condition.relationship.attribute, condition.relationship.duration);
                var newCondition = {
                    fact: condition.relationship.attribute,
                    operator: rval.operator,
                    value: rval.value,
                };
                rule[types_1.RulesEngineConditionalOperators.AND].push(newCondition);
            }
            else {
                var attributeCondition = {};
                if (createConditionsForAttribute(ruleInfo, attributeCondition, condition.relationship)) {
                    rule[types_1.RulesEngineConditionalOperators.AND].push(attributeCondition);
                }
            }
        }
        else {
            // Seems like we have nested conditions
            rule[types_1.RulesEngineConditionalOperators.AND].push({});
            var len = rule[types_1.RulesEngineConditionalOperators.AND].length;
            ParseAndConvertConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.AND][len - 1], condition);
        }
    }
}
function convertORConditions(ruleInfo, rule, conditions) {
    var subConditions = conditions[types_1.ConditionalOperators.OR];
    for (var i = 0; i < subConditions.length; i++) {
        var condition = subConditions[i];
        if (condition.hasOwnProperty('entity')) {
            // We have a condition
            rule[types_1.RulesEngineConditionalOperators.OR].push({});
            var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
            addANDConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        }
        else {
            // Seems like we have nested conditions
            rule[types_1.RulesEngineConditionalOperators.OR].push({});
            var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
            ParseAndConvertConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        }
    }
}
function addANDConditions(ruleInfo, rule, condition) {
    rule[types_1.RulesEngineConditionalOperators.AND] = [];
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET ||
        condition.entity.entity_type === types_1.EntityTypes.AREA ||
=======
function convertANDCondition(ruleInfo, rule, condition) {
    if (condition.hasOwnProperty('entity')) { // We have a condition
        var promise = addANDConditions(ruleInfo, rule, condition);
        // @ts-ignore
        Promise.runQueue();
        return promise;
    }
    else { // Seems like we have nested conditions
        rule[types_1.RulesEngineConditionalOperators.AND].push({});
        var len = rule[types_1.RulesEngineConditionalOperators.AND].length;
        var promise = ParseAndConvertConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.AND][len - 1], condition);
        // @ts-ignore
        Promise.runQueue();
        return promise;
    }
}
function convertORCondition(ruleInfo, rule, condition) {
    if (condition.hasOwnProperty('entity')) { // We have a condition
        rule[types_1.RulesEngineConditionalOperators.OR].push({});
        var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
        rule[types_1.RulesEngineConditionalOperators.AND] = [];
        var promise = addANDConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        //@ts-ignore
        Promise.runQueue();
        return promise;
    }
    else { // Seems like we have nested conditions
        rule[types_1.RulesEngineConditionalOperators.OR].push({});
        var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
        var promise = ParseAndConvertConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        //@ts-ignore
        Promise.runQueue();
        return promise;
    }
}
function addANDConditions(ruleInfo, rule, condition) {
    var promise = addSpecificEntityCondition(condition, rule).then(function (rule) {
        if (condition.relationship.attribute_type === types_1.EntityTypes.ASSET || condition.relationship.attribute_type === types_1.EntityTypes.AREA ||
            condition.relationship.attribute_type === types_1.EntityTypes.STATE) {
            var rval = types_1.GetOperatorAndValue(condition.relationship.operator, condition.relationship.value);
            duration_1.AddDuration(ruleInfo.id, ruleInfo.id, condition.relationship.attribute, condition.relationship.duration);
            var newCondition = {
                fact: condition.relationship.attribute,
                operator: rval.operator,
                value: rval.value
            };
            rule[types_1.RulesEngineConditionalOperators.AND].push(newCondition);
            return new Promise(function (res) { return res(rule); });
        }
        else {
            var attributeCondition_1 = {};
            var promise_1 = createConditionsForAttribute(ruleInfo, attributeCondition_1, condition.relationship).then(function (hasCondition) {
                if (hasCondition) {
                    rule[types_1.RulesEngineConditionalOperators.AND].push(attributeCondition_1);
                }
                return rule;
            });
            // @ts-ignore
            Promise.runQueue();
            return promise_1;
        }
    });
    //@ts-ignore
    Promise.runQueue();
    //@ts-ignore - Adam
    return promise;
}
function addSpecificEntityCondition(condition, rule) {
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET || condition.entity.entity_type === types_1.EntityTypes.AREA ||
>>>>>>> promisify convert-rule, add mocks, fix test
        condition.entity.entity_type === types_1.EntityTypes.STATE) {
        var entityCondition = {
            fact: 'id',
            operator: 'equal',
            value: condition.entity.id,
        };
        rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
        return new Promise(function (res) { return res(rule); });
    }
    else {
<<<<<<< HEAD
        var entityCondition = {};
        if (createConditionsForEntity(entityCondition, condition.entity)) {
            rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
        }
    }
    if (condition.relationship.attribute_type === types_1.EntityTypes.ASSET ||
        condition.relationship.attribute_type === types_1.EntityTypes.AREA ||
        condition.relationship.attribute_type === types_1.EntityTypes.STATE) {
        var rval = types_1.GetOperatorAndValue(condition.relationship.operator, condition.relationship.value);
        duration_1.AddDuration(ruleInfo.id, ruleInfo.id, condition.relationship.attribute, condition.relationship.duration);
        var newCondition = {
            fact: condition.relationship.attribute,
            operator: rval.operator,
            value: rval.value,
        };
        rule[types_1.RulesEngineConditionalOperators.AND].push(newCondition);
    }
    else {
        var attributeCondition = {};
        if (createConditionsForAttribute(ruleInfo, attributeCondition, condition.relationship)) {
            rule[types_1.RulesEngineConditionalOperators.AND].push(attributeCondition);
        }
=======
        var entityCondition_1 = {};
        var promise = createConditionsForEntity(entityCondition_1, condition.entity).then(function (hasCondition) {
            if (hasCondition) {
                rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition_1);
            }
            return rule;
        });
        // @ts-ignore
        Promise.runQueue();
        return promise;
>>>>>>> promisify convert-rule, add mocks, fix test
    }
}
=======
>>>>>>> type and lint errors
function createConditionsForEntity(rule, entity) {
=======
function createConditionsForEntity(entity) {
    var rule = {
        any: []
    };
>>>>>>> refactor conversions to include engine library types
    var promise;
    switch (entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(entity.id).then(function (assets) {
                if (assets.length > 0) {
                    for (var i = 0; i < assets.length; i++) {
                        rule.any.push({
                            fact: 'id',
                            operator: 'equal',
                            value: assets[i].id,
                        });
                    }
                    return rule;
                }
<<<<<<< HEAD
                return false;
<<<<<<< HEAD
            }
            rule[types_1.RulesEngineConditionalOperators.OR] = [];
            for (var i = 0; i < assets.length; i++) {
                var entityCondition = {
                    fact: 'id',
                    operator: 'equal',
                    value: assets[i].id,
                };
                rule[types_1.RulesEngineConditionalOperators.OR].push(entityCondition);
            }
            return true;
=======
=======
>>>>>>> refactor conversions to include engine library types
            });
            Promise.runQueue();
            return promise;
>>>>>>> promisify convert-rule, add mocks, fix test
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(entity.id).then(function (areas) {
                if (areas.length > 0) {
                    for (var i = 0; i < areas.length; i++) {
                        rule.any.push({
                            fact: 'id',
                            operator: 'equal',
                            value: areas[i].id,
                        });
                    }
                    return rule;
                }
<<<<<<< HEAD
                return false;
<<<<<<< HEAD
            }
            rule[types_1.RulesEngineConditionalOperators.OR] = [];
            for (var i = 0; i < areas.length; i++) {
                var entityCondition = {
                    fact: 'id',
                    operator: 'equal',
                    value: areas[i].id,
                };
                rule[types_1.RulesEngineConditionalOperators.OR].push(entityCondition);
            }
            return true;
=======
=======
>>>>>>> refactor conversions to include engine library types
            });
            Promise.runQueue();
            return promise;
>>>>>>> promisify convert-rule, add mocks, fix test
        default:
            return new Promise(function (res) { return res(); });
    }
}
function createConditionsForAttribute(id, relationship) {
    var rule = {
        any: []
    };
    var promise;
    switch (relationship.attribute_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(relationship.attribute).then(function (assets) {
                if (assets.length > 0) {
                    var rval = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
                    for (var i = 0; i < assets.length; i++) {
                        // AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id as string, relationship.duration);
                        rule.any.push({
                            fact: assets[i].id,
                            operator: rval.operator,
                            value: rval.value,
                        });
                    }
                    return rule;
                }
<<<<<<< HEAD
                return false;
<<<<<<< HEAD
            }
            rule[types_1.RulesEngineConditionalOperators.OR] = [];
            var rval = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
            for (var i = 0; i < assets.length; i++) {
                duration_1.AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id, relationship.duration);
                var attributeCondition = {
                    fact: assets[i].id,
                    operator: rval.operator,
                    value: rval.value,
                };
                rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
            }
            return true;
        case types_1.EntityTypes.AREA_TYPE:
            var areas = getAllAreasForType(relationship.attribute);
            if (areas.length <= 0) {
                return false;
            }
            rule[types_1.RulesEngineConditionalOperators.OR] = [];
            var rval2 = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
            for (var i = 0; i < areas.length; i++) {
                duration_1.AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id, relationship.duration);
                var attributeCondition = {
                    fact: areas[i].id,
                    operator: rval2.operator,
                    value: rval2.value,
                };
                rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
            }
            return true;
        default:
            return false;
    }
}
function getAllAssetsForType(assetType) {
    var assetsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var assetsCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
    assetsCollectionQuery.equalTo('type', assetType);
    if (assetsCollection) {
        assetsCollection.cbFetchPromise({ query: assetsCollectionQuery }).then(function (data) {
            return Array.isArray(data.DATA) ? data.DATA : [];
        });
        // @ts-ignore
        Promise.runQueue();
    }
    return [];
}
function getAllAreasForType(areaType) {
    var areasCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.AREAS);
    var areasCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.AREAS });
    areasCollectionQuery.equalTo('type', areaType);
    if (areasCollection) {
        areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(function (data) {
            return Array.isArray(data.DATA) ? data.DATA : [];
        });
        // @ts-ignore
        Promise.runQueue();
=======
=======
>>>>>>> refactor conversions to include engine library types
            });
            Promise.runQueue();
            return promise;
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(relationship.attribute).then(function (areas) {
                if (areas.length > 0) {
                    var rval2 = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
                    for (var i = 0; i < areas.length; i++) {
                        // AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id as string, relationship.duration);
                        rule.any.push({
                            fact: areas[i].id,
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
<<<<<<< HEAD
            return new Promise(function (res) { return res(false); });
>>>>>>> promisify convert-rule, add mocks, fix test
=======
            return new Promise(function (res) { return res(); });
>>>>>>> refactor conversions to include engine library types
    }
}
function addSpecificEntityCondition(condition, rule) {
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET ||
        condition.entity.entity_type === types_1.EntityTypes.AREA ||
        condition.entity.entity_type === types_1.EntityTypes.STATE) {
        var entityCondition = {
            fact: 'id',
            operator: 'equal',
            value: condition.entity.id,
        };
        rule.all.push(entityCondition);
        return new Promise(function (res) { return res(rule); });
    }
    else {
        var promise = createConditionsForEntity(condition.entity).then(function (entityCondition) {
            if (entityCondition) {
                rule.all.push(entityCondition);
            }
            return rule;
        });
        Promise.runQueue();
        return promise;
    }
}
function addANDConditions(id, condition) {
    var rule = {
        all: []
    };
    var promise = addSpecificEntityCondition(condition, rule).then(function (rule) {
        if (condition.relationship.attribute_type === types_1.EntityTypes.ASSET ||
            condition.relationship.attribute_type === types_1.EntityTypes.AREA ||
            condition.relationship.attribute_type === types_1.EntityTypes.STATE) {
            var rval = types_1.GetOperatorAndValue(condition.relationship.operator, condition.relationship.value);
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
            return new Promise(function (res) { return res(rule); });
        }
        else {
            var promise_1 = createConditionsForAttribute(id, condition.relationship).then(function (attributeCondition) {
                if (attributeCondition) {
                    rule.all.push(attributeCondition);
                }
                return rule;
            });
            Promise.runQueue();
            return promise_1;
        }
    });
    Promise.runQueue();
    return promise;
}
function convertANDCondition(id, condition) {
    if (condition.entity) {
        // We have a condition
        var promise = addANDConditions(id, condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions
        var promise = ParseAndConvertConditions(id, condition);
        Promise.runQueue();
        return promise;
    }
}
function convertORCondition(id, condition) {
    if (condition.entity) {
        // We have a condition        
        var promise = addANDConditions(id, condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions        
        var promise = ParseAndConvertConditions(id, condition);
        Promise.runQueue();
        return promise;
    }
}
function ParseAndConvertConditions(id, conditions) {
    if (conditions.hasOwnProperty(types_1.ConditionalOperators.AND)) {
        var subConditions = conditions[types_1.ConditionalOperators.AND];
        var promise = Promise.all(subConditions.map(function (s) { return convertANDCondition(id, s); })).then(function (rules) {
            if (rules.length > 1) {
                return {
                    all: __spreadArrays(rules)
                };
            }
            else {
                return __assign({}, rules[0]);
            }
        }).catch(function (e) {
            console.log('convertANDCondition error', e);
            return {};
        });
        Promise.runQueue();
        return promise;
    }
    else {
        // is an OR
        var subConditions = conditions[types_1.ConditionalOperators.OR];
        var promise = Promise.all(subConditions.map(function (s) { return convertORCondition(id, s); })).then(function (rules) {
            if (rules.length > 1) {
                return {
                    any: __spreadArrays(rules)
                };
            }
            else {
                return __assign({}, rules[0]);
            }
        }).catch(function (e) {
            return {};
        });
        Promise.runQueue();
        return promise;
    }
}
exports.ParseAndConvertConditions = ParseAndConvertConditions;
