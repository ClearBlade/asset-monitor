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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../../static/promise-polyfill");
require("core-js/features/map");
var json_rules_engine_1 = require("json-rules-engine");
var convert_rule_1 = require("./convert-rule");
var timeframe_1 = require("./timeframe");
var events_1 = require("./events");
var collection_lib_1 = require("../collection-lib");
var RulesEngine = /** @class */ (function () {
    function RulesEngine() {
        Number.parseFloat = parseFloat;
        this.rules = {};
        this.engine = new json_rules_engine_1.Engine([], {
            allowUndefinedFacts: true
        })
            .addFact('state', function (params, almanac) { return handleStateCondition(params, almanac); })
            .on('success', handleRuleSuccess);
    }
    RulesEngine.prototype.addRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = this.convertRule(ruleData).then(function (rule) {
                    _this.rules[rule.name] = rule;
                    _this.engine.addRule(rule);
                    return rule;
                });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    RulesEngine.prototype.editRule = function (id, ruleData) {
        this.deleteRule(id);
        this.addRule(ruleData);
    };
    RulesEngine.prototype.deleteRule = function (id) {
        this.engine.removeRule(this.rules[id]);
        delete this.rules[id];
    };
    RulesEngine.prototype.convertRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var label, event_type_id, priority, severity, id, timeframe, action_ids, conditions, parsedConditions, parsedTimeframe, parsedActionIDs, promise;
            return __generator(this, function (_a) {
                label = ruleData.label, event_type_id = ruleData.event_type_id, priority = ruleData.priority, severity = ruleData.severity, id = ruleData.id, timeframe = ruleData.timeframe, action_ids = ruleData.action_ids, conditions = ruleData.conditions;
                parsedConditions = JSON.parse(conditions || '{}');
                parsedTimeframe = !!timeframe ? JSON.parse(timeframe) : timeframe;
                parsedActionIDs = !!action_ids ? JSON.parse(action_ids) : action_ids;
                promise = convert_rule_1.parseAndConvertConditions(id, parsedConditions).then(function (convertedConditions) {
                    return new json_rules_engine_1.Rule({
                        name: id,
                        conditions: convertedConditions,
                        event: {
                            type: label,
                            params: {
                                eventTypeID: event_type_id,
                                actionIDs: parsedActionIDs,
                                priority: priority,
                                severity: severity,
                                timeframe: parsedTimeframe,
                                ruleID: id,
                                ruleName: label,
                            },
                        },
                    });
                });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    RulesEngine.prototype.run = function (fact) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                promise = this.engine.run(fact)
                    .then(function (results) { return "ENGINE FINISHED! Successful Rules: " + results.events.map(function (e) { return e.type; }).join(', '); })
                    .catch(function (e) { return "ENGINE ERROR: " + JSON.stringify(e); });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    return RulesEngine;
}());
exports.RulesEngine = RulesEngine;
function handleRuleSuccess(event, almanac, ruleResult) {
    // @ts-ignore json-rule-engine types does not include factMap
    var timestamp = almanac.factMap.get('incomingData').timestamp;
    var timeframe = event.params.timeframe;
    if (timeframe_1.doesTimeframeMatchRule(timestamp, timeframe)) {
        var triggers = getTriggerIds(ruleResult.conditions.hasOwnProperty('all') ? ruleResult.conditions.all : ruleResult.conditions.any, []);
        var entities = triggers.reduce(function (acc, trigger) {
            // @ts-ignore json-rule-engine types does not include factMap
            acc[trigger] = almanac.factMap.get(trigger).value.data;
            return acc;
        }, {});
        // @ts-ignore
        log('Processing rule for successful event: ' + JSON.stringify(ruleResult));
        events_1.processEvent(event, entities);
    }
}
function handleStateCondition(params, almanac) {
    var promise = almanac.factValue('incomingData').then(function (incomingData) {
        var promise = almanac.factValue(params.id).then(function (data) {
            return data ||
                new Promise(function (res) {
                    var collection = collection_lib_1.CbCollectionLib(params.collection);
                    var query = ClearBlade.Query({ collectionName: params.collection });
                    if (!!params.type) {
                        query.equalTo('type', params.type);
                    }
                    else {
                        query.equalTo('id', params.id);
                    }
                    var promise = collection.cbFetchPromise({ query: query }).then(function (data) {
                        var initialData; // the fact who started all this mess
                        for (var i = 0; i < data.DATA.length; i++) {
                            var entityData = data.DATA[i];
                            var withParsedCustomData = __assign(__assign({}, entityData), { custom_data: JSON.parse(entityData.custom_data || '{}') });
                            if (entityData.id === incomingData.id) { // if this one is the same as asset that triggered engine
                                withParsedCustomData = __assign(__assign(__assign({}, withParsedCustomData), incomingData), { custom_data: __assign(__assign({}, withParsedCustomData.custom_data), incomingData.custom_data) });
                            }
                            if (params.id === entityData.id) { // if this one is the same as asset that triggered fact
                                initialData = __assign({}, withParsedCustomData);
                            }
                            almanac.addRuntimeFact(entityData.id, { data: withParsedCustomData }); // add fact for id
                        }
                        res({ data: initialData }); // resolve the initial fact's value
                    });
                    Promise.runQueue();
                    return promise;
                });
        });
        Promise.runQueue();
        return promise;
    });
    Promise.runQueue();
    return promise;
}
function getTriggerIds(conditions, ids) {
    for (var i = 0; i < conditions.length; i++) {
        var firstKey = Object.keys(conditions[i])[0];
        if (firstKey === 'all' || firstKey === 'any') {
            getTriggerIds(conditions[i][firstKey], ids);
            // @ts-ignore json-rule-engine types does not include result
        }
        else if (!!conditions[i].result) {
            ids.push(conditions[i].params.id);
        }
    }
    return ids;
}
