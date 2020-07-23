"use strict";
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
require("@clearblade/promise-polyfill");
require("core-js/features/map");
var json_rules_engine_1 = require("json-rules-engine");
var convert_rule_1 = require("./convert-rule");
var events_1 = require("./events");
var utils_1 = require("./utils");
var DurationEngine_1 = require("./DurationEngine");
var RulesEngine = /** @class */ (function () {
    function RulesEngine(actionTopic) {
        var _this = this;
        Number.parseFloat = parseFloat;
        this.rules = {};
        this.actionTopic = actionTopic;
        this.durationEngine = DurationEngine_1.DurationEngine.getInstance();
        this.engine = new json_rules_engine_1.Engine([], {
            allowUndefinedFacts: true,
        })
            .addFact('entity', function (params, almanac) { return handleEntityFact(params, almanac); })
            .on('success', function (event, almanac, ruleResult) {
            return _this.handleRuleFinished(event, almanac, ruleResult, _this.actionTopic);
        })
            .on('failure', function (event, almanac, ruleResult) {
            return _this.handleRuleFinished(event, almanac, ruleResult, _this.actionTopic);
        });
        this.engine.addOperator('outside', handleOutsideOperator);
        this.engine.addOperator('inside', handleInsideOperator);
    }
    RulesEngine.prototype.addRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                if (!!ruleData.id && !!ruleData.conditions) {
                    promise = this.convertRule(ruleData).then(function (rule) {
                        _this.rules[rule.name] = rule;
                        _this.engine.addRule(rule);
                        log('RULE ADDED: ' + JSON.stringify(_this.rules));
                        return rule;
                    });
                    Promise.runQueue();
                    return [2 /*return*/, promise];
                }
                else {
                    return [2 /*return*/, new Promise(function (res, rej) {
                            return rej("Tried to add rule, but it does not have a valid id or is missing conditions");
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    RulesEngine.prototype.editRule = function (ruleData) {
        if (this.rules[ruleData.id]) {
            this.deleteRule(ruleData.id);
            this.addRule(ruleData);
            log('RULE EDITED: ' + JSON.stringify(this.rules));
        }
        else {
            this.addRule(ruleData);
        }
    };
    RulesEngine.prototype.deleteRule = function (id) {
        if (this.rules[id]) {
            this.engine.removeRule(this.rules[id]);
            delete this.rules[id];
            log('RULE DELETED: ' + JSON.stringify(this.rules));
        }
    };
    RulesEngine.prototype.clearRules = function () {
        var rules = Object.keys(this.rules);
        for (var i = 0; i < rules.length; i++) {
            this.deleteRule(rules[i]);
        }
    };
    RulesEngine.prototype.convertRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var label, event_type_id, priority, severity, id, timeframe, action_ids, conditions, closes_ids, parsedConditions, parsedTimeframe, parsedActionIDs, promise;
            return __generator(this, function (_a) {
                label = ruleData.label, event_type_id = ruleData.event_type_id, priority = ruleData.priority, severity = ruleData.severity, id = ruleData.id, timeframe = ruleData.timeframe, action_ids = ruleData.action_ids, conditions = ruleData.conditions, closes_ids = ruleData.closes_ids;
                parsedConditions = JSON.parse(conditions || '{}');
                parsedTimeframe = timeframe ? JSON.parse(timeframe) : timeframe;
                parsedActionIDs = action_ids ? JSON.parse(action_ids) : action_ids;
                promise = convert_rule_1.parseAndConvertConditions(parsedConditions).then(function (convertedConditions) {
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
                                ruleType: Object.keys(convertedConditions)[0],
                                closesIds: JSON.parse(closes_ids || '[]'),
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
                promise = this.engine
                    .run(fact)
                    .then(function (results) { return "ENGINE FINISHED! Successful Rules: " + results.events.map(function (e) { return e.type; }).join(', '); })
                    .catch(function (e) { return "ENGINE ERROR: " + JSON.stringify(e); });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    RulesEngine.prototype.handleRuleFinished = function (event, almanac, ruleResult, actionTopic) {
        log('Processing rule for event: ' + JSON.stringify(ruleResult));
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore json-rule-engine types does not include factMap
        var incomingData = almanac.factMap.get('incomingData').value;
        var processedResults = utils_1.processRule([ruleResult.conditions]);
        var filteredResults = utils_1.filterProcessedRule(processedResults, incomingData.id);
        if (event.params.ruleType === 'any' && filteredResults.trues.length) {
            filteredResults.pendingDurations = []; // get rid of these since we don't need to process them because it's an 'or'
            var ruleId = event.params.ruleID;
            this.durationEngine.clearTimersForRule(ruleId);
        }
        var entities = utils_1.aggregateFactMap(filteredResults, almanac);
        if (filteredResults.trues.length) {
            events_1.processSuccessfulEvent(filteredResults.trues, event.params, entities, actionTopic, incomingData);
        }
        if (filteredResults.pendingDurations.length) {
            this.durationEngine.processDurations(filteredResults.pendingDurations, event.params, entities, actionTopic, incomingData);
        }
    };
    return RulesEngine;
}());
exports.RulesEngine = RulesEngine;
function handleInsideOperator(asset, area) {
    if (asset && area) {
        var parsedPoly = JSON.parse(area.data.polygon || '[]');
        var hasCoords = asset.data.latitude && asset.data.longitude;
        if (hasCoords && parsedPoly.length >= 3) {
            var geoObj_1 = new geo('polar');
            var point = geoObj_1.Point(asset.data.latitude, asset.data.longitude);
            var poly = geoObj_1.Polygon(parsedPoly.map(function (p) { return geoObj_1.Point(p.lat, p.long); }));
            return geoObj_1.Within(poly, point);
        }
    }
    return false;
}
function handleOutsideOperator(asset, area) {
    if (asset && area) {
        var parsedPoly = JSON.parse(area.data.polygon || '[]');
        var hasCoords = asset.data.latitude && asset.data.longitude;
        if (hasCoords && parsedPoly.length >= 3) {
            var geoObj_2 = new geo('polar');
            var point = geoObj_2.Point(asset.data.latitude, asset.data.longitude);
            var poly = geoObj_2.Polygon(parsedPoly.map(function (p) { return geoObj_2.Point(p.lat, p.long); }));
            return !geoObj_2.Within(poly, point);
        }
    }
    return false;
}
function handleEntityFact(params, almanac) {
    var promise = almanac.factValue('incomingData').then(function (incomingData) {
        var isIncoming = params.id === incomingData.id;
        var isDifferentType = params.type !== incomingData.type;
        if (isIncoming || isDifferentType) {
            var promise_1 = almanac.factValue(params.id).then(function (data) {
                return data || utils_1.collectAndBuildFact(almanac, params.id, params.type, params.collection, incomingData);
            });
            Promise.runQueue();
            return promise_1;
        }
    });
    Promise.runQueue();
    return promise;
}
