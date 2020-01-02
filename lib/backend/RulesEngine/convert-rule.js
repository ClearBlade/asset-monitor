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
function createConditionsForEntity(entity) {
    var rule = {
        any: []
    };
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
            });
            Promise.runQueue();
            return promise;
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
            });
            Promise.runQueue();
            return promise;
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
            return new Promise(function (res) { return res(); });
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
