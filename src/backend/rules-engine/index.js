"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./promise-polyfill");
require("core-js/features/map");
var json_rules_engine_1 = require("json-rules-engine");
var RulesEngine = /** @class */ (function () {
    function RulesEngine() {
        Number.parseFloat = parseFloat;
        this.engine = new json_rules_engine_1.Engine();
    }
    RulesEngine.prototype.addRule = function (rule) {
        this.engine.addRule(rule);
    };
    RulesEngine.prototype.addFact = function (factName, func) {
        this.engine.addFact(factName, func);
    };
    RulesEngine.prototype.run = function (facts) {
        var resp = "";
        this.engine.run(facts)
            .then(function (results) {
            resp = results;
        }, function (err) {
            resp = err.message;
        });
        Promise.runQueue();
        return resp;
    };
    return RulesEngine;
}());
// @ts-ignore
global.RulesEngine = RulesEngine;
