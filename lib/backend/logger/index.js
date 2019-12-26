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
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
function Logger(config) {
    // pass the loglevel and the message: any type is allowed
    var messaging = ClearBlade.Messaging();
    function publishLog(logLevel) {
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        var pubMsg = createPrettyLogWithName(config, messages);
        switch (logLevel) {
            case global_config_1.GC.LOG_LEVEL.INFO:
                if (global_config_1.GC.LOG_SETTING === global_config_1.GC.LOG_LEVEL.INFO || global_config_1.GC.LOG_SETTING === global_config_1.GC.LOG_LEVEL.DEBUG) {
                    messaging.publish(global_config_1.GC.LOG_LEVEL.INFO, pubMsg);
                }
                break;
            case global_config_1.GC.LOG_LEVEL.DEBUG:
                if (global_config_1.GC.LOG_SETTING === global_config_1.GC.LOG_LEVEL.DEBUG) {
                    messaging.publish(global_config_1.GC.LOG_LEVEL.DEBUG, pubMsg);
                }
                break;
            default:
                messaging.publish(logLevel, pubMsg);
                break;
        }
    }
    return {
        publishLog: publishLog,
    };
}
exports.Logger = Logger;
