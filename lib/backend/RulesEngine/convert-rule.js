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
var duration_1 = require("./duration");
require("../../static/promise-polyfill");
var async_1 = require("./async");
function createConditionsForEntity(rule, entity) {
    var promise;
    switch (entity.entity_type) {
        case types_1.EntityTypes.ASSET_TYPE:
            promise = async_1.getAllAssetsForType(entity.id).then(function (assets) {
                if (assets.length > 0) {
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
                }
                return false;
            });
            Promise.runQueue();
            return promise;
        case types_1.EntityTypes.AREA_TYPE:
            promise = async_1.getAllAreasForType(entity.id).then(function (areas) {
                if (areas.length > 0) {
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
                }
                return false;
            });
            Promise.runQueue();
            return promise;
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
                            value: rval.value,
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
                    }
                    return true;
                }
                return false;
            });
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
                            value: rval2.value,
                        };
                        rule[types_1.RulesEngineConditionalOperators.OR].push(attributeCondition);
                    }
                    return true;
                }
                return false;
            });
            Promise.runQueue();
            return promise;
        default:
            return new Promise(function (res) { return res(false); });
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
        rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition);
        return new Promise(function (res) { return res(rule); });
    }
    else {
        var entityCondition_1 = {};
        var promise = createConditionsForEntity(entityCondition_1, condition.entity).then(function (hasCondition) {
            if (hasCondition) {
                rule[types_1.RulesEngineConditionalOperators.AND].push(entityCondition_1);
            }
            return rule;
        });
        Promise.runQueue();
        return promise;
    }
}
function addANDConditions(ruleInfo, rule, condition) {
    rule[types_1.RulesEngineConditionalOperators.AND] = [];
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
            var newCondition = {
                fact: condition.relationship.attribute,
                operator: rval.operator,
                value: rval.value,
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
            Promise.runQueue();
            return promise_1;
        }
    });
    Promise.runQueue();
    return promise;
}
function convertANDCondition(ruleInfo, rule, condition) {
    if (condition.entity) {
        // We have a condition
        var promise = addANDConditions(ruleInfo, rule, condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions
        var promise = ParseAndConvertConditions(ruleInfo, {}, condition);
        Promise.runQueue();
        return promise;
    }
}
function convertORCondition(ruleInfo, rule, condition) {
    if (condition.entity) {
        // We have a condition        
        var promise = addANDConditions(ruleInfo, {}, condition);
        Promise.runQueue();
        return promise;
    }
    else {
        // Seems like we have nested conditions        
        var promise = ParseAndConvertConditions(ruleInfo, {}, condition);
        Promise.runQueue();
        return promise;
    }
}
function ParseAndConvertConditions(ruleInfo, rule, conditions) {
    if (conditions.hasOwnProperty(types_1.ConditionalOperators.AND)) {
        var subConditions = conditions[types_1.ConditionalOperators.AND];
        var promise = Promise.all(subConditions.map(function (s) { return convertANDCondition(ruleInfo, __assign({}, rule), s); })).then(function (rules) {
            var _a;
            if (rules.length > 1) {
                return __assign(__assign({}, rule), (_a = {}, _a[types_1.RulesEngineConditionalOperators.AND] = __spreadArrays(rules), _a));
            }
            else {
                return __assign({}, rules[0]);
            }
        }).catch(function (e) {
            console.log('convertANDCondition error', e);
            return rule;
        });
        Promise.runQueue();
        return promise;
    }
    else {
        // is an OR
        var subConditions = conditions[types_1.ConditionalOperators.OR];
        var promise = Promise.all(subConditions.map(function (s) { return convertORCondition(ruleInfo, __assign({}, rule), s); })).then(function (rules) {
            var _a;
            if (rules.length > 1) {
                return __assign(__assign({}, rule), (_a = {}, _a[types_1.RulesEngineConditionalOperators.OR] = __spreadArrays(rules), _a));
            }
            else {
                return __assign({}, rules[0]);
            }
        }).catch(function (e) {
            return rule;
        });
        Promise.runQueue();
        return promise;
    }
}
exports.ParseAndConvertConditions = ParseAndConvertConditions;
