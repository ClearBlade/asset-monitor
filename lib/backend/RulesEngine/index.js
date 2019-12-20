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
Object.defineProperty(exports, "__esModule", { value: true });
require("../../static/promise-polyfill");
require("core-js/features/map");
var json_rules_engine_1 = require("json-rules-engine");
var convert_rule_1 = require("./convert-rule");
var timeframe_1 = require("./timeframe");
var events_1 = require("./events");
// @ts-ignore
var log = global.log;
var RulesEngine = /** @class */ (function () {
    function RulesEngine() {
        Number.parseFloat = parseFloat;
        var options = {
            allowUndefinedFacts: true
        };
        this.engine = new json_rules_engine_1.Engine([], options);
        this.data = {};
    }
    RulesEngine.prototype.addRule = function (rule) {
        this.engine.addRule(rule);
    };
    RulesEngine.prototype.convertRule = function (ruleData) {
        var name = ruleData.label;
        var conditions = JSON.parse(ruleData.conditions);
        var timeframe;
        var actionIDs = [];
        if (ruleData.timeframe !== "") {
            timeframe = JSON.parse(ruleData.timeframe);
        }
        if (ruleData["action_ids"] !== "") {
            actionIDs = JSON.parse(ruleData["action_ids"]);
        }
        var rule = {
            name: name,
            conditions: {},
            event: {
                type: name,
                params: {
                    eventTypeID: ruleData["event_type_id"],
                    actionIDs: actionIDs,
                    priority: ruleData.priority,
                    severity: ruleData.severity,
                    timeframe: timeframe,
                    ruleID: ruleData["id"],
                    ruleName: name
                }
            }
        };
        var ruleInfo = {
            name: name,
            id: ruleData["id"]
        };
        var promise = convert_rule_1.ParseAndConvertConditions(ruleInfo, rule.conditions, conditions).then(function (convertedConditions) {
            return __assign(__assign({}, rule), { conditions: convertedConditions });
        });
        // @ts-ignore
        Promise.runQueue();
        return promise;
    };
    RulesEngine.prototype.run = function (facts) {
        this.engine.run(facts).then(function (results) {
            processRuleResults(results.events[0], facts);
            return results;
        }, function (err) { return err.message; });
        // @ts-ignore
        Promise.runQueue();
    };
    return RulesEngine;
}());
exports.RulesEngine = RulesEngine;
function processRuleResults(event, facts) {
    if (event === undefined) {
        // rule failed
        log("Rule failed");
        return;
    }
    var params = event.params;
    if (params.timeframe !== undefined) {
        if (!timeframe_1.DoesTimeframeMatchRule(params.timeframe)) {
            log("Cannot run rule because timeframe constraints failed: " + event.type);
            return;
        }
    }
    events_1.FireEventsAndActions(params);
    log("Rule success " + JSON.stringify(event) + " and " + JSON.stringify(facts));
}
