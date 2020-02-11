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
var DurationEngine = /** @class */ (function () {
    function DurationEngine() {
        this.timerStore = {};
        this.messaging = ClearBlade.Messaging();
        // this.messaging.subscribe(DURATION_TOPIC, this.timerExecuted);
    }
    DurationEngine.getInstance = function () {
        if (!DurationEngine._instance) {
            DurationEngine._instance = new DurationEngine();
        }
        return DurationEngine._instance;
    };
    DurationEngine.prototype.clearTimersForRule = function (ruleId) {
        if (this.timerStore[ruleId]) {
            var timersForRule = this.timerStore[ruleId];
            var keys = Object.keys(timersForRule);
            for (var i = 0; i < keys.length; i++) {
                var timer = timersForRule[keys[i]];
                this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            }
            delete this.timerStore[ruleId];
        }
    };
    DurationEngine.prototype.clearTimer = function (ruleId, key) {
        if (this.timerStore[ruleId] && this.timerStore[ruleId][key]) {
            var timer = this.timerStore[ruleId][key];
            this.messaging.cancelCBTimeout(timer.timerId, cancelTimeoutCallback);
            delete this.timerStore[ruleId][key];
        }
        if (!Object.keys(this.timerStore[ruleId]).length) {
            delete this.timerStore[ruleId];
        }
    };
    DurationEngine.prototype.timerExecuted = function (err, data) {
        if (err) {
            log("Error on subscription: " + data + "}");
        }
        else if (data) {
            var userData = JSON.parse(data).userData;
            var _a = JSON.parse(userData), key = _a.key, ruleId = _a.ruleId;
            var _b = this.timerStore[ruleId][key], conditions = _b.conditions, entities = _b.entities, actionTopic = _b.actionTopic, incomingData = _b.incomingData, ruleParams = _b.ruleParams;
            var ids = [];
            for (var i = 0; i < conditions.length; i++) {
                if (!conditions[i].result) {
                    this.clearTimer(ruleId, key);
                    return;
                }
                else {
                    ids.push(conditions[i].id);
                }
            }
            events_1.processSuccessfulEvent(ids, ruleParams, entities, actionTopic, incomingData);
            if (ruleParams.ruleType === 'any') {
                this.clearTimersForRule(ruleParams.ruleID);
            }
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
        var ruleId = ruleParams.ruleID;
        if (!this.timerStore[ruleId]) {
            this.timerStore[ruleId] = {};
        }
        for (var i = 0; i < combinations.length; i++) {
            var key = getKey(combinations[i]);
            if (this.timerStore[ruleId][key]) {
                var existingTimer = this.timerStore[ruleId][key];
                var pickedEntities = pickEntities(combinations[i], entities);
                this.evaluateIncomingConditions(combinations[i], existingTimer, pickedEntities, ruleId, incomingData);
            }
            else {
                this.timerStore[ruleId][key] = buildTimerObject(combinations[i], entities, actionTopic, incomingData, ruleParams);
                this.startTimer(key, ruleId, this.timerStore[ruleId][key]);
            }
        }
    };
    return DurationEngine;
}());
exports.DurationEngine = DurationEngine;
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
