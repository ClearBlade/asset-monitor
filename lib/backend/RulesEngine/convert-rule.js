"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var duration_1 = require("./duration");
require("../../static/promise-polyfill");
var async_1 = require("./async");
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
function createConditionsForEntity(rule, entity) {
    var promise;
    switch (entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(entity.id).then(function (assets) {
                if (assets.length > 0) {
                    rule[types_1.RulesEngineConditionalOperators.OR] = [];
                    for (var i = 0; i < assets.length; i++) {
                        var entityCondition = {
                            fact: "id",
                            operator: "equal",
                            value: assets[i].id
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(entityCondition);
                    }
                    return true;
                }
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
            });
            //@ts-ignore
            Promise.runQueue();
            return promise;
>>>>>>> promisify convert-rule, add mocks, fix test
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(entity.id).then(function (areas) {
                if (areas.length > 0) {
                    rule[types_1.RulesEngineConditionalOperators.OR] = [];
                    for (var i = 0; i < areas.length; i++) {
                        var entityCondition = {
                            fact: "id",
                            operator: "equal",
                            value: areas[i].id
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(entityCondition);
                    }
                    return true;
                }
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
            });
            //@ts-ignore
            Promise.runQueue();
            return promise;
>>>>>>> promisify convert-rule, add mocks, fix test
        default:
            return new Promise(function (res) { return res(false); });
    }
}
function createConditionsForAttribute(ruleInfo, rule, relationship) {
    var promise;
    switch (relationship.attribute_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(relationship.attribute).then(function (assets) {
                if (assets.length > 0) {
                    rule[types_1.RulesEngineConditionalOperators.OR] = [];
                    var rval = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
                    for (var i = 0; i < assets.length; i++) {
                        duration_1.AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id, relationship.duration);
                        var attributeCondition = {
                            fact: assets[i].id,
                            operator: rval.operator,
                            value: rval.value
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
                    }
                    return true;
                }
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
            });
            //@ts-ignore
            Promise.runQueue();
            return promise;
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(relationship.attribute).then(function (areas) {
                if (areas.length > 0) {
                    rule[types_1.RulesEngineConditionalOperators.OR] = [];
                    var rval2 = types_1.GetOperatorAndValue(relationship.operator, relationship.value);
                    for (var i = 0; i < areas.length; i++) {
                        duration_1.AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id, relationship.duration);
                        var attributeCondition = {
                            fact: areas[i].id,
                            operator: rval2.operator,
                            value: rval2.value
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
                    }
                    return true;
                }
            });
        default:
            return new Promise(function (res) { return res(false); });
>>>>>>> promisify convert-rule, add mocks, fix test
    }
}
