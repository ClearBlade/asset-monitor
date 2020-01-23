"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var RulesEngine_1 = require("./RulesEngine");
var Normalizer_1 = require("../Normalizer");
var RULES_UPDATED_TOPIC = 'rules_collection_updated';
function rulesEngineSS(_a) {
    var resp = _a.resp, incomingDataTopics = _a.incomingDataTopics, fetchRulesForEngine = _a.fetchRulesForEngine, actionTopic = _a.actionTopic;
    var engine = new RulesEngine_1.RulesEngine(actionTopic);
    var messaging = ClearBlade.Messaging();
    fetchRulesForEngine().then(function (rules) {
        Promise.all(rules.map(function (ruleData) {
            var promise = engine
                .addRule(ruleData)
                .then(function (rule) { return rule.name; })
                .catch(function (e) {
                log('Error adding rule: ' + JSON.stringify(e));
            });
            Promise.runQueue();
            return promise;
        }))
            .then(function (ruleNames) {
            log("Successfully added rules: " + ruleNames.join(', '));
            subscribeAndInitialize();
        })
            .catch(function (e) {
            log(e);
        });
        Promise.runQueue();
    });
    Promise.runQueue();
    function subscribeAndInitialize() {
        Promise.all(__spreadArrays(incomingDataTopics, [RULES_UPDATED_TOPIC]).map(function (topic) {
            Normalizer_1.subscriber(topic);
        }))
            .then(function () {
            initializeWhileLoop();
        })
            .catch(function (e) {
            log("Subscription error: " + JSON.stringify(e));
        });
        Promise.runQueue();
    }
    function initializeWhileLoop() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(__spreadArrays(incomingDataTopics, [RULES_UPDATED_TOPIC]), handleIncomingMessage);
        }
    }
    function handleIncomingMessage(err, msg, topic) {
        if (err) {
            resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
        }
        else {
            if (topic === RULES_UPDATED_TOPIC) {
                handleRulesCollUpdate(msg);
            }
            else {
                var incomingData = void 0;
                try {
                    incomingData = JSON.parse(msg);
                }
                catch (e) {
                    resp.error('Invalid message structure: ' + JSON.stringify(e));
                }
                var fact = { incomingData: incomingData };
                engine
                    .run(fact)
                    .then(function (successMsg) {
                    log(successMsg);
                })
                    .catch(function (e) {
                    resp.error(e);
                });
                Promise.runQueue();
            }
        }
    }
    function handleRulesCollUpdate(msg) {
        var parsedMessage;
        try {
            parsedMessage = JSON.parse(msg);
        }
        catch (e) {
            resp.error('Invalid message structure for update rules collection: ' + JSON.stringify(e));
        }
        switch (parsedMessage.type) {
            case 'CREATE':
                engine.addRule(parsedMessage.data);
                break;
            case 'UPDATE':
                engine.editRule(parsedMessage.data);
                break;
            case 'DELETE':
                engine.deleteRule(parsedMessage.data.id);
                break;
            default:
                return;
        }
    }
}
exports.rulesEngineSS = rulesEngineSS;
