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
        if (type) {
            query.equalTo('type', type);
        }
        else {
            query.equalTo('id', id);
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
function buildProcessedCondition(fact) {
    return {
        id: fact.params.id,
        associatedId: typeof fact.value === 'object' && fact.value.params.id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include result
        result: fact.result,
        duration: fact.params.duration,
        value: fact.value,
        operator: fact.operator,
        timerStart: 0,
    };
}
function isValidFact(fact) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore json-rule-engine types does not include result
    if (fact.factResult || fact.factResult === false || fact.factResult === '') {
        return buildProcessedCondition(fact);
    }
}
function processFact(condition, processedLevel, parentOperator) {
    var validFact = isValidFact(condition);
    if (validFact) {
        processedLevel.push(parentOperator === 'all' ? validFact : [validFact]);
    }
}
function processAllCondition(condition, processedLevel) {
    var result = processRule(condition, 'all');
    if (Array.isArray(result[0])) {
        processedLevel.push.apply(processedLevel, result);
    }
    else {
        processedLevel.push(result);
    }
}
function processAnyCondition(condition, processedLevel) {
    var result = processRule(condition, 'any');
    if (!processedLevel.length) {
        for (var j = 0; j < result.length; j++) {
            if (Array.isArray(result[j])) {
                processedLevel.push(result[j]);
            }
            else {
                processedLevel.push([result[j]]);
            }
        }
    }
    else {
        var incomingprocessedLevel = __spreadArrays(processedLevel);
        processedLevel = [];
        for (var j = 0; j < result.length; j++) {
            for (var n = 0; n < incomingprocessedLevel.length; n++) {
                if (Array.isArray(incomingprocessedLevel[n])) {
                    processedLevel.push(__spreadArrays(incomingprocessedLevel[n], result[j]));
                }
                else {
                    processedLevel.push(__spreadArrays([
                        incomingprocessedLevel[n]
                    ], result[j]));
                }
            }
        }
    }
    return processedLevel;
}
function processRule(conditions, parentOperator) {
    var processedLevel = [];
    for (var i = 0; i < conditions.length; i++) {
        var operatorKey = Object.keys(conditions[i])[0];
        if (operatorKey === 'all') {
            processAllCondition(conditions[i][operatorKey], processedLevel);
        }
        else if (operatorKey === 'any') {
            processedLevel = processAnyCondition(conditions[i][operatorKey], processedLevel);
        }
        else {
            processFact(conditions[i], processedLevel, parentOperator);
        }
    }
    return processedLevel;
}
exports.processRule = processRule;
function filterProcessedRule(processedRule, triggerId) {
    return processedRule.reduce(function (filteredRule, combination) {
        var hasId = false;
        var hasDuration = false;
        var allTrue = true;
        for (var i = 0; i < combination.length; i++) {
            if (combination[i].id === triggerId) {
                hasId = true;
            }
            if (combination[i].duration) {
                hasDuration = true;
            }
            if (!combination[i].result) {
                allTrue = false;
            }
        }
        if (hasId) {
            if (allTrue && !hasDuration) {
                for (var j = 0; j < combination.length; j++) {
                    filteredRule.trues.push(combination[j].id);
                    if (combination[j].associatedId) {
                        filteredRule.trues.push(combination[j].associatedId);
                    }
                }
            }
            else if (hasDuration) {
                var sorted = combination.sort(function (a, b) {
                    if (a.duration === b.duration) {
                        return a.id > b.id ? 1 : -1;
                    }
                    return b.duration - a.duration;
                });
                filteredRule.pendingDurations.push(sorted);
            }
        }
        return filteredRule;
    }, {
        trues: [],
        pendingDurations: [],
    });
}
exports.filterProcessedRule = filterProcessedRule;
function uniqueArray(arr) {
    var seen = {};
    return arr.filter(function (item) {
        return Object.prototype.hasOwnProperty.call(seen, item) ? false : (seen[item] = true);
    });
}
exports.uniqueArray = uniqueArray;
////////// grab data for assets/areas to send to event or duration processing
function aggregateFactMap(processedRule, almanac) {
    var factMap = processedRule.trues.reduce(function (acc, id) {
        if (!acc[id]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore json-rule-engine types does not include factMap
            acc[id] = almanac.factMap.get(id).value.data;
        }
        return acc;
    }, {});
    processedRule.pendingDurations.reduce(function (acc, combination) {
        for (var i = 0; i < combination.length; i++) {
            if (!acc[combination[i].id]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i].id] = almanac.factMap.get(combination[i].id).value.data;
            }
            if (combination[i].associatedId && !acc[combination[i].associatedId]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore json-rule-engine types does not include factMap
                acc[combination[i].associatedId] = almanac.factMap.get(combination[i].associatedId).value.data;
            }
        }
        return acc;
    }, factMap);
    return factMap;
}
exports.aggregateFactMap = aggregateFactMap;
