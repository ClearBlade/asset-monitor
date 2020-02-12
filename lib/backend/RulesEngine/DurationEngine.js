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
var uuid = require("uuid/v4");
var events_1 = require("./events");
exports.DURATION_TOPIC = 'rule_duration_reached';
var DURATION_CACHE = 'rule_duration_cache';
var DurationEngine = /** @class */ (function () {
    function DurationEngine() {
        this.timerCache = ClearBlade.Cache(DURATION_CACHE);
        this.messaging = ClearBlade.Messaging();
    }
    DurationEngine.getInstance = function () {
        if (!DurationEngine._instance) {
            DurationEngine._instance = new DurationEngine();
        }
        return DurationEngine._instance;
    };
    DurationEngine.prototype.getCacheHandler = function (ruleId, callback) {
        this.timerCache.get(ruleId, function (err, data) {
            if (err) {
                log("Error getting cache for rule: " + ruleId);
            }
            else {
                callback(data);
            }
        });
    };
    DurationEngine.prototype.clearTimersForRule = function (ruleId) {
        var _this = this;
        this.getCacheHandler(ruleId, function (data) {
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                var timer = data[keys[i]];
                _this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            }
            _this.timerCache.delete(ruleId, deleteCacheCallback);
        });
    };
    DurationEngine.prototype.clearTimer = function (ruleId, key) {
        var _this = this;
        this.getCacheHandler(ruleId, function (data) {
            var timer = data[key];
            _this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            delete data[key];
            if (!Object.keys(data).length) {
                _this.timerCache.delete(ruleId, deleteCacheCallback);
            }
            else {
                _this.timerCache.set(ruleId, data, setCacheCallback);
            }
        });
    };
    DurationEngine.prototype.timerExecuted = function (err, data) {
        var _this = this;
        if (data) {
            var userData = JSON.parse(data).userData;
            var _a = JSON.parse(userData), key_1 = _a.key, ruleId_1 = _a.ruleId;
            this.getCacheHandler(ruleId_1, function (data) {
                var _a = data[key_1], conditions = _a.conditions, entities = _a.entities, actionTopic = _a.actionTopic, incomingData = _a.incomingData, ruleParams = _a.ruleParams;
                var ids = [];
                for (var i = 0; i < conditions.length; i++) {
                    if (!conditions[i].result) {
                        _this.clearTimer(ruleId_1, key_1);
                        return;
                    }
                    else {
                        ids.push(conditions[i].id);
                    }
                }
                events_1.processSuccessfulEvent(ids, ruleParams, entities, actionTopic, incomingData);
                if (ruleParams.ruleType === 'any') {
                    _this.clearTimersForRule(ruleId_1);
                }
                else {
                    _this.clearTimer(ruleId_1, key_1);
                }
            });
        }
    };
    DurationEngine.prototype.startTimer = function (key, ruleId, timer) {
        var timerId = uuid();
        var remainingTime = timer.timedEntity.duration - (Date.now() - timer.timedEntity.timerStart);
        var data = JSON.stringify({
            ruleId: ruleId,
            key: key,
        });
        timer.timerId = timerId;
        this.messaging.setTimeout(remainingTime, exports.DURATION_TOPIC, data, createTimeoutCallback);
    };
    DurationEngine.prototype.evaluateIncomingConditions = function (conditions, existingTimer, entities, ruleId, incomingData) {
        var timedCondition = conditions.find(function (c) { return c.id === existingTimer.timedEntity.id; });
        if (!timedCondition.result) {
            delete existingTimer.timedEntity;
        }
        for (var i = 0; i < conditions.length; i++) {
            if (conditions[i].result) {
                handleTrueCondition(conditions[i], existingTimer, i); // may update existingTimer if remaing time for any exceeds the current timed entity
            }
            else if (existingTimer.conditions[i].result) {
                existingTimer.conditions[i] = conditions[i];
            }
        }
        if (existingTimer.timedEntity) {
            // timer(s) ongoing
            if (timedCondition.id !== existingTimer.timedEntity.id) {
                var key = getKey(conditions);
                this.messaging.cancelCBTimeout(existingTimer.timerId, cancelTimeoutCallback);
                this.startTimer(key, ruleId, existingTimer);
                existingTimer.incomingData = incomingData;
            }
            existingTimer.entities = entities;
        }
        else {
            // no ongoing timers - clear it
            var key = getKey(conditions);
            this.clearTimer(ruleId, key);
        }
    };
    DurationEngine.prototype.processDurations = function (combinations, ruleParams, entities, actionTopic, incomingData) {
        var _this = this;
        var ruleId = ruleParams.ruleID;
        this.getCacheHandler(ruleId, function (data) {
            var timersForRule = data || {};
            for (var i = 0; i < combinations.length; i++) {
                var key = getKey(combinations[i]);
                if (timersForRule[key]) {
                    var existingTimer = timersForRule[key];
                    var pickedEntities = pickEntities(combinations[i], entities);
                    _this.evaluateIncomingConditions(combinations[i], existingTimer, pickedEntities, ruleId, incomingData);
                }
                else {
                    timersForRule[key] = buildTimerObject(combinations[i], entities, actionTopic, incomingData, ruleParams);
                    _this.startTimer(key, ruleId, timersForRule[key]);
                }
            }
            _this.timerCache.set(ruleId, timersForRule, setCacheCallback);
        });
    };
    return DurationEngine;
}());
exports.DurationEngine = DurationEngine;
function handleTrueCondition(incomingCondition, existingTimer, idx) {
    if (!existingTimer.conditions[idx].result) {
        existingTimer.conditions[idx] = __assign(__assign({}, incomingCondition), { timerStart: Date.now() });
    }
    var remainingExistingTime = existingTimer.timedEntity.duration - (Date.now() - existingTimer.timedEntity.timerStart);
    var remainingIncomingTime = incomingCondition.duration && incomingCondition.duration - (Date.now() - incomingCondition.timerStart);
    if (remainingIncomingTime && (!existingTimer.timedEntity || remainingIncomingTime > remainingExistingTime)) {
        existingTimer.timedEntity = incomingCondition;
    }
}
function getKey(combination) {
    return combination.map(function (c) { return c.id; }).join('');
}
function pickEntities(combination, entities) {
    return combination.reduce(function (acc, entity) {
        if (!acc[entity.id]) {
            acc[entity.id] = entities[entity.id];
        }
        return acc;
    }, {});
}
function buildTimerObject(conditions, entities, actionTopic, incomingData, ruleParams) {
    return {
        conditions: conditions,
        entities: pickEntities(conditions, entities),
        actionTopic: actionTopic,
        incomingData: incomingData,
        ruleParams: ruleParams,
        timerId: '',
        timedEntity: __assign(__assign({}, conditions[0]), { timerStart: Date.now() }),
    };
}
function setCacheCallback(err, msg) {
    if (err) {
        log("Error setting cache for rule: " + JSON.stringify(msg));
    }
}
function deleteCacheCallback(err, msg) {
    if (err) {
        log("Error deleting cache for rule: " + JSON.stringify(msg));
    }
}
function createTimeoutCallback(err, msg) {
    if (err) {
        log("Error creating timeout: " + JSON.stringify(msg));
    }
}
function cancelTimeoutCallback(err, msg) {
    if (err) {
        log("Error canceling timeout: " + JSON.stringify(msg));
    }
}
