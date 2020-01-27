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
var collection_lib_1 = require("../collection-lib");
function collectAndBuildFact(almanac, id, type, collectionName, incomingData) {
    return new Promise(function (res) {
        var collection = collection_lib_1.CbCollectionLib(collectionName);
        var query = ClearBlade.Query({ collectionName: collectionName });
        if (id === incomingData.id) {
            query.equalTo('id', id);
        }
        else {
            query.equalTo('type', type);
        }
        var promise = collection
            .cbFetchPromise({ query: query })
            .then(function (data) {
            var initialData; // the fact who started all this mess
            for (var i = 0; i < data.DATA.length; i++) {
                var entityData = data.DATA[i];
                var fact = buildFact(entityData, incomingData);
                if (id === entityData.id) {
                    // if this one is the same as asset that triggered fact
                    initialData = __assign({}, fact);
                }
                almanac.addRuntimeFact(entityData.id, { data: fact }); // add fact for id
            }
            res({ data: initialData }); // resolve the initial fact's value
        });
        Promise.runQueue();
        return promise;
    });
}
exports.collectAndBuildFact = collectAndBuildFact;
function buildFact(entityData, incomingData) {
    var withParsedCustomData = __assign(__assign({}, entityData), { custom_data: JSON.parse(entityData.custom_data || '{}') });
    if (entityData.id === incomingData.id) {
        // if this one is the same as asset that triggered engine
        withParsedCustomData = __assign(__assign(__assign({}, withParsedCustomData), incomingData), { custom_data: __assign(__assign({}, withParsedCustomData.custom_data), incomingData.custom_data) });
    }
    return withParsedCustomData;
}
exports.buildFact = buildFact;
function aggregateFactMap(almanac, conditionIds) {
    return conditionIds.reduce(function (acc, combination) {
        for (var i = 0; i < combination.length; i++) {
            if (!acc[combination[i]]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i]] = almanac.factMap.get(combination[i]).value.data;
            }
        }
        return acc;
    }, {});
}
exports.aggregateFactMap = aggregateFactMap;
function isValidFact(fact, processedRule) {
    var params = fact.params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore json-rule-engine types does not include result
    if (fact.factResult) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include result
        if (fact.result) {
            processedRule.hasSuccessfulResult = true;
            if (params.duration) {
                processedRule.hasDuration = true;
            }
            return params.id;
        }
        else if (params.duration) {
            processedRule.hasDuration = true;
            return params.id;
        }
    }
}
function validateAndFilterFacts(facts, processedRule) {
    var validIds = [];
    var factLength = facts.length;
    for (var i = factLength - 1; i >= 0; i--) {
        var validId = isValidFact(facts[i], processedRule);
        if (validId) {
            validIds.push(validId);
        }
        else {
            facts.pop();
        }
    }
    return validIds;
}
function processFacts(facts, processedRule, parentOperator) {
    var validIds = validateAndFilterFacts(facts, processedRule);
    if (parentOperator === 'all') {
        if (!processedRule.conditionIds.length) {
            processedRule.conditionIds = [validIds];
            processedRule.numValidCombination = processedRule.conditionIds[0].length;
        }
        else {
            for (var i = 0; i < validIds.length; i++) {
                for (var j = 0; j < processedRule.conditionIds.length; j++) {
                    processedRule.conditionIds[j].push(validIds[i]);
                    if (processedRule.conditionIds[j].length > processedRule.numValidCombination) {
                        processedRule.numValidCombination = processedRule.conditionIds[j].length;
                    }
                }
            }
        }
    }
    else {
        if (!processedRule.conditionIds.length) {
            processedRule.conditionIds = validIds.map(function (id) { return [id]; });
            processedRule.numValidCombination = validIds.length ? 1 : 0;
        }
        else {
            for (var k = 0; k < validIds.length; k++) {
                var idsLength = processedRule.conditionIds.length;
                for (var n = 0; n < idsLength; n++) {
                    if (k === 0) {
                        processedRule.conditionIds[n].push(validIds[k]);
                    }
                    else {
                        var modified = __spreadArrays(processedRule.conditionIds[n]);
                        modified[modified.length - 1] = validIds[k];
                        processedRule.conditionIds.push(modified);
                    }
                    if (processedRule.conditionIds[n].length > processedRule.numValidCombination) {
                        processedRule.numValidCombination = processedRule.conditionIds[n].length;
                    }
                }
            }
        }
    }
}
function processRule(conditions, processedRule, parentOperator) {
    for (var i = 0; i < conditions.length; i++) {
        var operatorKey = conditions[i]['any']
            ? 'any'
            : conditions[i]['all']
                ? 'all'
                : '';
        if (operatorKey === 'all' || operatorKey === 'any') {
            processRule(conditions[i][operatorKey], processedRule, operatorKey);
        }
        else {
            processFacts(conditions, processedRule, parentOperator);
            break;
        }
    }
    processedRule.conditionIds.map(function (array) { return array.sort(); });
    return processedRule;
}
exports.processRule = processRule;
