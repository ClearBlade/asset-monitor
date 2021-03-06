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
var Logger_1 = require("../Logger");
var global_config_1 = require("../global-config");
var Util_1 = require("../Util");
var messaging_utils_1 = require("@clearblade/messaging-utils");
exports.subscriber = messaging_utils_1.subscriber;
exports.bulkSubscriber = messaging_utils_1.bulkSubscriber;
require("@clearblade/promise-polyfill");
function publisher(assets, pubConfig) {
    var messaging = ClearBlade.Messaging();
    var _loop_1 = function (i, l) {
        var assetID = assets[i].id;
        var topic = pubConfig.topicFn(assetID);
        var pubData = {};
        pubConfig.keysToPublish.forEach(function (value) {
            pubData[value] = assets[i][value];
        });
        if (typeof pubConfig.shouldPublishAsset === 'undefined' || pubConfig.shouldPublishAsset(pubData)) {
            messaging.publish(topic, JSON.stringify(pubData));
        }
    };
    for (var i = 0, l = assets.length; i < l; i++) {
        _loop_1(i, l);
    }
}
exports.publisher = publisher;
function bulkPublisher(assets, normalizerPubConfig) {
    if (normalizerPubConfig === void 0) { normalizerPubConfig = global_config_1.GC.NORMALIZER_PUB_CONFIG; }
    Object.keys(normalizerPubConfig).forEach(function (key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}
exports.bulkPublisher = bulkPublisher;
/*
publishExternalEvent is a utility function for publishing external events to the rules topic with the correct format
*/
function publishExternalEvent(asset, ruleId, timestamp, ruleTopicFn) {
    if (ruleTopicFn === void 0) { ruleTopicFn = Util_1.Topics.RulesAssetLocation; }
    ClearBlade.Messaging().publish(ruleTopicFn(asset.id), JSON.stringify(__assign(__assign({}, asset), { meta: { rule_id: ruleId, is_external_rule_type: true, timestamp: timestamp } })));
}
exports.publishExternalEvent = publishExternalEvent;
function normalizer(config) {
    var messageParser = config.messageParser;
    var publishConfig = config.normalizerPubConfig || global_config_1.GC.NORMALIZER_PUB_CONFIG;
    var logServiceName = config.logServiceName || 'Normalizer';
    var logSetting = config.logSetting || global_config_1.LogLevels.DEBUG;
    var TOPIC = config.topics[0];
    var SERVICE_INSTANCE_ID = config.req.service_instance_id;
    var messaging = ClearBlade.Messaging();
    var logger = new Logger_1.Logger({ name: logServiceName, logSetting: logSetting });
    logger.publishLog(global_config_1.LogLevels.DEBUG, 'Normalizer SERVICE_INSTANCE_ID:: ' + SERVICE_INSTANCE_ID);
    var subscribePromises = [];
    for (var i = 0, l = config.topics.length; i < l; i++) {
        subscribePromises.push(messaging_utils_1.subscriber(config.topics[i]));
    }
    function failureCb(error) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed ', Util_1.getErrorMessage(error));
    }
    function HandleMessage(err, msg, topic) {
        if (err) {
            config.resp.error("HandleMessage error inside Normalizer. Service was probably killed while waiting for messages. " + JSON.stringify({ err: err, msg: msg, topic: topic }));
        }
        //promisifying
        messageParser(err, msg, topic)
            .then(function (assets) {
            bulkPublisher(assets, publishConfig);
        })
            .catch(failureCb);
        Promise.runQueue();
        //maybe TODO: give a callback
    }
    function WaitLoop() {
        logger.publishLog(global_config_1.LogLevels.INFO, 'Subscribed to Shared Topics. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }
    Promise.all(subscribePromises)
        .then(WaitLoop)
        .catch(failureCb);
    Promise.runQueue();
}
exports.normalizer = normalizer;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
global.normalizer = normalizer;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
global.publishExternalEvent = publishExternalEvent;
exports.api = {
    default: normalizer,
    publisher: publisher,
};
