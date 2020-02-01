"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
function prettyLog() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (args.length > 0) {
        return "" + args.map(function (a) { return (typeof a === 'object' ? JSON.stringify(a) : a); }).join(' ');
    }
    return '';
}
exports.prettyLog = prettyLog;
function createPrettyLogWithName(config) {
    var messages = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        messages[_i - 1] = arguments[_i];
    }
    return prettyLog.apply(void 0, __spreadArrays([config.name], messages));
}
exports.createPrettyLogWithName = createPrettyLogWithName;
var defaultConfig = {
    name: 'NameNotSet',
    logSetting: global_config_1.GC.LOG_SETTING,
};
var Logger = /** @class */ (function () {
    function Logger(_a) {
        var _b = _a === void 0 ? defaultConfig : _a, _c = _b.name, name = _c === void 0 ? defaultConfig.name : _c, _d = _b.logSetting, logSetting = _d === void 0 ? defaultConfig.logSetting : _d;
        this.levels = {
            trace: 1,
            debug: 2,
            info: 3,
            warn: 4,
            error: 5,
            fatal: 6,
        };
        this.name = name;
        this.logSetting = logSetting;
    }
    /**
     * Converts a string level (trace/debug/info/warn/error) into a number
     *
     * @param minLevel
     */
    Logger.prototype.levelToInt = function (minLevel) {
        if (minLevel.toLowerCase() in this.levels)
            return this.levels[minLevel.toLowerCase()];
        else
            return 99;
    };
    Logger.prototype.publishLog = function (logLevel) {
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        var messaging = ClearBlade.Messaging();
        var pubMsg = createPrettyLogWithName({ name: this.name }, messages);
        var level = this.levelToInt(logLevel);
        var minLevel = this.levelToInt(this.logSetting || '');
        if (level < minLevel)
            return;
        messaging.publish(logLevel, pubMsg);
    };
    return Logger;
}());
exports.Logger = Logger;
