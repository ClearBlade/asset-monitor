"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../static/promise-polyfill");
var async_1 = require("./async");
var uuid = require("uuid/v4");
var timeframe_1 = require("./timeframe");
function processSuccessfulEvent(ids, ruleParams, entities, actionTopic, trigger) {
    if (timeframe_1.doesTimeframeMatchRule(new Date().toISOString(), ruleParams.timeframe)) {
        var filteredEntities = ids.reduce(function (acc, id) {
            acc[id] = entities[id];
            return acc;
        }, {});
        processEvent(ruleParams, filteredEntities, actionTopic, trigger);
    }
}
exports.processSuccessfulEvent = processSuccessfulEvent;
function getSplitEntities(entities) {
    return Object.keys(entities).reduce(function (acc, id) {
        if (entities[id].polygon) {
            acc.areas[id] = entities[id];
        }
        else {
            acc.assets[id] = entities[id];
        }
        return acc;
    }, {
        assets: {},
        areas: {},
    });
}
function processEvent(ruleParams, entities, actionTopic, trigger) {
    var eventTypeID = ruleParams.eventTypeID, actionIDs = ruleParams.actionIDs, priority = ruleParams.priority, severity = ruleParams.severity, ruleID = ruleParams.ruleID, closesIds = ruleParams.closesIds;
    var splitEntities = getSplitEntities(entities);
    var promise = async_1.closeRules(closesIds, splitEntities).then(function (shouldProceed) {
        if (shouldProceed) {
            var promise_1 = async_1.shouldCreateOrUpdateEvent(ruleID, splitEntities).then(function (shouldCreate) {
                if (shouldCreate) {
                    var promise_2 = async_1.getStateForEvent(eventTypeID).then(function (_a) {
                        var is_open = _a.is_open, state = _a.state;
                        var id = uuid();
                        var timestamp = new Date().toISOString();
                        var item = {
                            last_updated: timestamp,
                            is_open: is_open,
                            label: eventTypeID + "_" + id,
                            severity: severity,
                            id: id,
                            type: eventTypeID,
                            state: state,
                            priority: priority,
                            action_ids: JSON.stringify(actionIDs || []),
                            rule_id: ruleID,
                            assets: JSON.stringify(splitEntities.assets),
                            areas: JSON.stringify(splitEntities.areas),
                        };
                        var promise = async_1.createEvent(item).then(function () {
                            var promise = async_1.createEventHistoryItem({
                                event_id: id,
                                timestamp: timestamp,
                                transition_value: state,
                                transition_attribute: 'state',
                            }).then(function () {
                                if (actionTopic) {
                                    for (var i = 0; i < actionIDs.length; i++) {
                                        performAction(actionIDs[i], item, actionTopic, trigger);
                                    }
                                }
                                return item;
                            });
                            Promise.runQueue();
                            return promise;
                        });
                        Promise.runQueue();
                        return promise;
                    });
                    Promise.runQueue();
                    return promise_2;
                }
                else {
                    return {};
                }
            });
            Promise.runQueue();
            return promise_1;
        }
    });
    Promise.runQueue();
    return promise;
}
exports.processEvent = processEvent;
function performAction(actionId, event, actionTopic, triggerMessage) {
    async_1.getActionByID(actionId).then(function (action) {
        var messaging = ClearBlade.Messaging();
        messaging.publish(actionTopic, JSON.stringify({
            action: action,
            event: event,
            triggerMessage: triggerMessage,
        }));
    });
    Promise.runQueue();
}
