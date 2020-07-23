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
var Normalizer_1 = require("../Normalizer");
var Util_1 = require("../Util");
var DurationEngine_1 = require("./DurationEngine");
var events_1 = require("./events");
var RulesEngine_1 = require("./RulesEngine");
var types_1 = require("./types");
var RULES_ENTITY_UPDATED_TOPIC = 'rules_entity_updated';
var RULES_UPDATED_TOPIC = 'rules_collection_updated';
var RULES_SHARED_GROUP = 'rules_shared_topic';
function rulesEngineSS(_a) {
    var resp = _a.resp, incomingDataTopics = _a.incomingDataTopics, fetchRulesForEngine = _a.fetchRulesForEngine, actionTopic = _a.actionTopic;
    var engine = new RulesEngine_1.RulesEngine(actionTopic);
    var durationEngine = DurationEngine_1.DurationEngine.getInstance();
    var messaging = ClearBlade.Messaging();
    var sharedTopics = __spreadArrays(incomingDataTopics, [DurationEngine_1.DURATION_TOPIC]).map(function (t) { return "$share/" + RULES_SHARED_GROUP + "/" + t; });
    var externalRules = [];
    function fetchAndConvertRules() {
        var promise = fetchRulesForEngine().then(function (rules) {
            externalRules = rules.filter(function (r) { return r.is_external; });
            return Promise.all(rules
                .filter(function (r) { return !r.is_external; })
                .map(function (ruleData) {
                var promise = engine
                    .addRule(ruleData)
                    .then(function (rule) { return rule.name; })
                    .catch(function (e) {
                    log('Error adding rule: ' + JSON.stringify(e));
                });
                Promise.runQueue();
                return promise;
            }));
        });
        Promise.runQueue();
        return promise;
    }
    function subscribeAndInitialize() {
        Promise.all(__spreadArrays(sharedTopics, [RULES_UPDATED_TOPIC, RULES_ENTITY_UPDATED_TOPIC]).map(function (topic) {
            Normalizer_1.subscriber(topic);
        }))
            .then(function () {
            initializeWhileLoop();
        })
            .catch(function (e) {
            log("Subscription error: " + e.message + " " + e.stack);
        });
        Promise.runQueue();
    }
    function initializeWhileLoop() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(__spreadArrays(sharedTopics, [RULES_UPDATED_TOPIC, RULES_ENTITY_UPDATED_TOPIC]), handleIncomingMessage);
        }
    }
    function handleIncomingMessage(err, msg, topic) {
        var _a;
        var _b, _c;
        if (err) {
            resp.error('Error calling waitForMessage ' + JSON.stringify(msg));
        }
        else if (topic) {
            if (topic === RULES_UPDATED_TOPIC) {
                handleRulesCollUpdate(msg);
            }
            else if (topic === RULES_ENTITY_UPDATED_TOPIC) {
                engine.clearRules();
                fetchAndConvertRules();
            }
            else if (topic === "$share/" + RULES_SHARED_GROUP + "/" + DurationEngine_1.DURATION_TOPIC) {
                durationEngine.timerExecuted(err, msg);
            }
            else {
                var incomingData = void 0;
                try {
                    incomingData = __assign(__assign({}, JSON.parse(msg)), { entityType: topic.includes('_asset') ? types_1.EntityTypes.ASSET : types_1.EntityTypes.AREA });
                }
                catch (e) {
                    resp.error('Invalid message structure: ' + JSON.stringify(e));
                }
                if ((_b = incomingData.meta) === null || _b === void 0 ? void 0 : _b.is_external_rule_type) {
                    var ruleId_1 = (_c = incomingData.meta) === null || _c === void 0 ? void 0 : _c.rule_id;
                    var found = externalRules.filter(function (r) { return r.id === ruleId_1; })[0]; // I would use .find but requires a polyfill
                    if (found) {
                        events_1.processEvent({
                            eventTypeID: found.event_type_id,
                            actionIDs: Util_1.tryParse(found.action_ids, []),
                            priority: found.priority,
                            severity: found.severity,
                            timeframe: Util_1.tryParse(found.timeframe, {}),
                            ruleID: ruleId_1,
                            closesIds: Util_1.tryParse(found.closes_ids, []),
                            timestamp: incomingData.meta.timestamp
                                ? incomingData.meta.timestamp
                                : events_1.getDefaultTimestamp(),
                        }, (_a = {}, _a[incomingData.id] = incomingData, _a), actionTopic, incomingData);
                    }
                    else {
                        log("Warning: Could not find external rule with rule_id '" + ruleId_1 + "'", 'externalRules=', externalRules);
                    }
                }
                else {
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
                for (var i = 0; i < parsedMessage.data.length; i++) {
                    engine.deleteRule(parsedMessage.data[i]);
                }
                break;
            default:
                return;
        }
    }
    fetchAndConvertRules()
        .then(function (ruleNames) {
        log("Engine started and uccessfully added rules: " + ruleNames.join(', '));
        subscribeAndInitialize();
    })
        .catch(function (e) {
        log(e);
    });
}
exports.rulesEngineSS = rulesEngineSS;
