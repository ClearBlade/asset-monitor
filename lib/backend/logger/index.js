"use strict";
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
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
function Logger() {
    // pass the loglevel and the message: any type is allowed
    var messaging = ClearBlade.Messaging();
    function publishLog(logLevel) {
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        var pubMsg = prettyLog(messages);
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
