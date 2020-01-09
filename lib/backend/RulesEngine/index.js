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
var RulesEngine_1 = require("./RulesEngine");
var Normalizer_1 = require("../Normalizer");
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
                //@ts-ignore
                log('Error adding rule: ' + JSON.stringify(e));
            });
            Promise.runQueue();
            return promise;
        }))
            .then(function (ruleNames) {
            //@ts-ignore
            log("Successfully added rules: " + ruleNames.join(', '));
            subscribeAndInitialize();
        })
            .catch(function (e) {
            //@ts-ignore
            log(e);
        });
        Promise.runQueue();
    });
    Promise.runQueue();
    function subscribeAndInitialize() {
        Promise.all(incomingDataTopics.map(function (topic) {
            Normalizer_1.subscriber(topic);
        }))
            .then(function () {
            initializeWhileLoop();
        })
            .catch(function (e) {
            //@ts-ignore
            log("Subscription error: " + JSON.stringify(e));
        });
        Promise.runQueue();
    }
    function initializeWhileLoop() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(incomingDataTopics, handleIncomingMessage);
        }
    }
    function handleIncomingMessage(err, msg, topic) {
        if (err) {
            resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
        }
        else {
            var id = topic.split('/')[2];
            var parsedMessage = void 0;
            try {
                parsedMessage = JSON.parse(msg);
            }
            catch (e) {
                resp.error('Invalid message structure: ' + JSON.stringify(e));
            }
            var fact = {
                incomingData: __assign({ id: id }, parsedMessage),
            };
            engine
                .run(fact)
                .then(function (successMsg) {
                //@ts-ignore
                log(successMsg);
            })
                .catch(function (e) {
                resp.error(e);
            });
            Promise.runQueue();
        }
    }
}
exports.rulesEngineSS = rulesEngineSS;
