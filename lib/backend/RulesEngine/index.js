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
require("../../static/promise-polyfill");
require("core-js/features/map");
var json_rules_engine_1 = require("json-rules-engine");
var convert_rule_1 = require("./convert-rule");
var timeframe_1 = require("./timeframe");
var events_1 = require("./events");
function processRuleResults(events, facts, timestamp) {
    if (events.length > 0) {
        for (var i = 0; i < events.length; i++) {
            if (!!events[i]) {
                var params = events[i].params;
                if (timeframe_1.DoesTimeframeMatchRule(timestamp, params.timeframe)) {
                    // log('Cannot run rule because timeframe constraints failed: ' + event.type);
                    events_1.FireEventsAndActions(events[i]);
                }
            }
        }
        // log('Rule success ' + JSON.stringify(event) + ' and ' + JSON.stringify(facts));
    }
    // rule failed
    // log('Rule failed');
    console.log('facts', facts);
    return;
}
var RulesEngine = /** @class */ (function () {
    function RulesEngine() {
        Number.parseFloat = parseFloat;
        var options = {
            allowUndefinedFacts: true,
        };
        this.engine = new json_rules_engine_1.Engine([], options);
        this.data = {};
    }
    RulesEngine.prototype.addRule = function (rule) {
        this.engine.addRule(rule);
    };
    RulesEngine.prototype.convertRule = function (ruleData) {
        return __awaiter(this, void 0, void 0, function () {
            var label, event_type_id, priority, severity, id, timeframe, action_ids, conditions, parsedConditions, parsedTimeframe, parsedActionIDs, promise;
            return __generator(this, function (_a) {
                label = ruleData.label, event_type_id = ruleData.event_type_id, priority = ruleData.priority, severity = ruleData.severity, id = ruleData.id, timeframe = ruleData.timeframe, action_ids = ruleData.action_ids, conditions = ruleData.conditions;
                parsedConditions = JSON.parse(conditions || '{}');
                parsedTimeframe = !!timeframe ? JSON.parse(timeframe) : timeframe;
                parsedActionIDs = !!action_ids ? JSON.parse(action_ids) : action_ids;
                promise = convert_rule_1.ParseAndConvertConditions(id, parsedConditions).then(function (convertedConditions) {
                    return {
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
                        priority: priority
                    };
                });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    RulesEngine.prototype.run = function (facts, timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                promise = this.engine.run(facts).then(function (results) {
                    processRuleResults(results.events, facts, timestamp);
                    return results;
                }, function (err) { return err.message; });
                Promise.runQueue();
                return [2 /*return*/, promise];
            });
        });
    };
    return RulesEngine;
}());
exports.RulesEngine = RulesEngine;
