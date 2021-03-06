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
var events_1 = require("./events");
exports.DURATION_TOPIC = 'rule_duration_reached';
var DURATION_CACHE = 'rule_duration_cache';
var DurationEngine = /** @class */ (function () {
    function DurationEngine(cache) {
        if (cache === void 0) { cache = ClearBlade.Cache(DURATION_CACHE); }
        this.timerCache = cache;
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
                callback(data ? __assign({}, data) : {});
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
    DurationEngine.prototype.cancelAndClearTimer = function (ruleId, key) {
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
                        _this.cancelAndClearTimer(ruleId_1, key_1);
                        return;
                    }
                    else {
                        ids.push(conditions[i].id);
                        if (conditions[i].associatedId) {
                            ids.push(conditions[i].associatedId);
                        }
                    }
                }
                events_1.processSuccessfulEvent(ids, ruleParams, entities, actionTopic, incomingData);
                if (ruleParams.ruleType === 'any') {
                    _this.clearTimersForRule(ruleId_1);
                }
                else {
                    _this.cancelAndClearTimer(ruleId_1, key_1);
                }
            });
        }
    };
    DurationEngine.prototype.startTimerAndGetId = function (key, ruleId, timer) {
        var _this = this;
        var data = JSON.stringify({
            ruleId: ruleId,
            key: key,
        });
        return new Promise(function (res, rej) {
            _this.messaging.setTimeout(timer.timedEntity.duration, exports.DURATION_TOPIC, data, function (err, msg) {
                if (err) {
                    log("Error creating timeout: " + JSON.stringify(msg));
                    rej();
                }
                else {
                    res(msg);
                }
            });
        });
    };
    DurationEngine.prototype.modifyTimer = function (conditions, existingTimer, entities, ruleId, incomingData, isNew) {
        var timedCondition = conditions.filter(function (c) { return c.id === existingTimer.timedEntity.id; })[0];
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
            if (timedCondition.id !== existingTimer.timedEntity.id || isNew) {
                var key = getKey(conditions);
                if (!isNew) {
                    this.messaging.cancelCBTimeout(existingTimer.timerId, cancelTimeoutCallback);
                }
                var promise = this.startTimerAndGetId(key, ruleId, existingTimer).then(function (timerId) {
                    return __assign(__assign({}, existingTimer), { timerId: timerId,
                        incomingData: incomingData,
                        entities: entities });
                });
                Promise.runQueue();
                return promise;
            }
            return new Promise(function (res) {
                res(__assign(__assign({}, existingTimer), { entities: entities }));
            });
        }
        else if (!isNew) {
            // no ongoing timers - clear it
            var key = getKey(conditions);
            this.cancelAndClearTimer(ruleId, key);
        }
        return new Promise(function (res) { return res(); });
    };
    DurationEngine.prototype.evaluateIncomingCombination = function (combination, ruleParams, timer, entities, actionTopic, incomingData) {
        var pickedEntities = pickEntities(combination, entities);
        var existingTimer = timer && __assign({}, timer);
        if (!existingTimer) {
            existingTimer = buildTimerObject(combination, entities, actionTopic, incomingData, ruleParams);
        }
        return this.modifyTimer(combination, existingTimer, pickedEntities, ruleParams.ruleID, incomingData, !timer);
    };
    DurationEngine.prototype.processDurations = function (combinations, ruleParams, entities, actionTopic, incomingData) {
        var _this = this;
        var ruleId = ruleParams.ruleID;
        return new Promise(function (res) {
            return _this.getCacheHandler(ruleId, function (data) {
                Promise.all(combinations.map(function (c) {
                    var key = getKey(c);
                    _this.evaluateIncomingCombination(c, ruleParams, data[key], entities, actionTopic, incomingData).then(function (newTimer) {
                        if (newTimer) {
                            data[key] = newTimer;
                        }
                        else if (data[key]) {
                            delete data[key];
                        }
                    });
                })).then(function () {
                    if (Object.keys(data).length) {
                        _this.timerCache.set(ruleId, data, setCacheCallback);
                    }
                    else {
                        _this.clearTimersForRule(ruleId);
                    }
                    res();
                });
                Promise.runQueue();
            });
        });
    };
    return DurationEngine;
}());
exports.DurationEngine = DurationEngine;
function handleTrueCondition(incomingCondition, existingTimer, idx) {
    var updatedCondition = __assign({}, incomingCondition);
    if (!existingTimer.conditions[idx].result) {
        updatedCondition = __assign(__assign({}, incomingCondition), { timerStart: Date.now() });
        existingTimer.conditions[idx] = updatedCondition;
    }
    var remainingExistingTime;
    if (existingTimer.timedEntity) {
        remainingExistingTime =
            existingTimer.timedEntity.duration - (Date.now() - existingTimer.timedEntity.timerStart);
    }
    var remainingIncomingTime = updatedCondition.duration && updatedCondition.duration - (Date.now() - updatedCondition.timerStart);
    if (remainingIncomingTime && remainingExistingTime) {
        if (!existingTimer.timedEntity || remainingIncomingTime > remainingExistingTime) {
            existingTimer.timedEntity = updatedCondition;
        }
    }
}
function getKey(combination) {
    var key = '';
    for (var i = 0; i < combination.length; i++) {
        key += combination[i].id;
        if (combination[i].associatedId) {
            key += combination[i].operator + combination[i].associatedId; // for area
        }
        else {
            key += combination[i].value; //for state
        }
    }
    return key;
}
function pickEntities(combination, entities) {
    return combination.reduce(function (acc, entity) {
        if (!acc[entity.id]) {
            acc[entity.id] = entities[entity.id];
        }
        if (entity.associatedId && !acc[entity.associatedId]) {
            acc[entity.associatedId] = entities[entity.associatedId];
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
function cancelTimeoutCallback(err, msg) {
    if (err) {
        log("Error canceling timeout: " + JSON.stringify(msg));
    }
}
