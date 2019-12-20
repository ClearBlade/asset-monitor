"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var duration_1 = require("./duration");
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
require("../../static/promise-polyfill");
// @ts-ignore
var ClearBlade = global.ClearBlade;
function ParseAndConvertConditions(ruleInfo, rule, conditions) {
    if (conditions.hasOwnProperty('and')) {
        rule[types_1.RulesEngineConditionalOperators.AND] = [];
        convertANDConditions(ruleInfo, rule, conditions);
    }
    else if (conditions.hasOwnProperty('or')) {
        rule[types_1.RulesEngineConditionalOperators.OR] = [];
        convertORConditions(ruleInfo, rule, conditions);
    }
}
exports.ParseAndConvertConditions = ParseAndConvertConditions;
function convertANDConditions(ruleInfo, rule, conditions) {
    var subConditions = conditions[types_1.ConditionalOperators.AND];
    for (var i = 0; i < subConditions.length; i++) {
        var condition = subConditions[i];
        if (condition.hasOwnProperty('entity')) { // We have a condition
            if (condition.entity.entity_type === types_1.EntityTypes.ASSET || condition.entity.entity_type === types_1.EntityTypes.AREA ||
                condition.entity.entity_type === types_1.EntityTypes.STATE) {
                var entityCondition = {
                    fact: "id",
                    operator: "equal",
                    value: condition.entity.id
                };
                rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
            }
            else {
                var entityCondition = {};
                if (createConditionsForEntity(entityCondition, condition.entity)) {
                    rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
                }
            }
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
            }
            else {
                var attributeCondition = {};
                if (createConditionsForAttribute(ruleInfo, attributeCondition, condition.relationship)) {
                    rule[types_1.RulesEngineConditionalOperators.AND].push(attributeCondition);
                }
            }
        }
        else { // Seems like we have nested conditions
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
        if (condition.hasOwnProperty('entity')) { // We have a condition
            rule[types_1.RulesEngineConditionalOperators.OR].push({});
            var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
            addANDConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        }
        else { // Seems like we have nested conditions
            rule[types_1.RulesEngineConditionalOperators.OR].push({});
            var len = rule[types_1.RulesEngineConditionalOperators.OR].length;
            ParseAndConvertConditions(ruleInfo, rule[types_1.RulesEngineConditionalOperators.OR][len - 1], condition);
        }
    }
}
function addANDConditions(ruleInfo, rule, condition) {
    rule[types_1.RulesEngineConditionalOperators.AND] = [];
    if (condition.entity.entity_type === types_1.EntityTypes.ASSET || condition.entity.entity_type === types_1.EntityTypes.AREA ||
        condition.entity.entity_type === types_1.EntityTypes.STATE) {
        var entityCondition = {
            fact: "id",
            operator: "equal",
            value: condition.entity.id
        };
        rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
    }
    else {
        var entityCondition = {};
        if (createConditionsForEntity(entityCondition, condition.entity)) {
            rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
        }
    }
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
    }
    else {
        var attributeCondition = {};
        if (createConditionsForAttribute(ruleInfo, attributeCondition, condition.relationship)) {
            rule[types_1.RulesEngineConditionalOperators.AND].push(attributeCondition);
        }
    }
}
function createConditionsForEntity(rule, entity) {
    switch (entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            var assets = getAllAssetsForType(entity.id);
            if (assets.length <= 0) {
                return false;
            }
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
        case types_1.EntityTypes.AREA_TYPE:
            var areas = getAllAreasForType(entity.id);
            if (areas.length <= 0) {
                return false;
            }
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
        default:
            return false;
    }
}
function createConditionsForAttribute(ruleInfo, rule, relationship) {
    switch (relationship.attribute_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            var assets = getAllAssetsForType(relationship.attribute);
            if (assets.length <= 0) {
                return false;
            }
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
                    value: rval2.value
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
    areasCollectionQuery.equalTo("type", areaType);
    if (areasCollection) {
        areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(function (data) {
            return Array.isArray(data.DATA) ? data.DATA : [];
        });
        // @ts-ignore
        Promise.runQueue();
    }
    return [];
}
