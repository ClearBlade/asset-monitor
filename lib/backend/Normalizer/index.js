"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logger_1 = require("../Logger");
var global_config_1 = require("../global-config");
var Util_1 = require("../Util");
require("../../static/promise-polyfill/index.js");
function subscriber(topic) {
    var messaging = ClearBlade.Messaging();
    var promise = new Promise(function (resolve, reject) {
        messaging.subscribe(topic, function (err, data) {
            if (err) {
                reject(new Error('Error with subscribing: ' + JSON.stringify(data)));
            }
            else {
                resolve(data);
            }
        });
    });
    return promise;
}
exports.subscriber = subscriber;
function bulkSubscriber(topics) {
    return new Promise(function (resolve, reject) {
        Promise.all(topics.map(function (topic) {
            subscriber(topic);
        }))
            .then(function () {
            resolve();
        })
            .catch(function (e) {
            log("Subscription error: " + e.message);
            reject(new Error(e));
        });
        Promise.runQueue();
    });
}
exports.bulkSubscriber = bulkSubscriber;
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
function normalizer(config) {
    var messageParser = config.messageParser;
    var publishConfig = config.normalizerPubConfig || global_config_1.GC.NORMALIZER_PUB_CONFIG;
    var TOPIC = config.topics[0];
    var SERVICE_INSTANCE_ID = config.req.service_instance_id;
    var messaging = ClearBlade.Messaging();
    var logger = new Logger_1.Logger({ name: 'Normalizer' });
    logger.publishLog(global_config_1.LogLevels.DEBUG, 'Normalizer SERVICE_INSTANCE_ID:: ' + SERVICE_INSTANCE_ID);
    var subscribePromises = [];
    for (var i = 0, l = config.topics.length; i < l; i++) {
        subscribePromises.push(subscriber(config.topics[i]));
    }
    function failureCb(error) {
        logger.publishLog(global_config_1.LogLevels.ERROR, SERVICE_INSTANCE_ID, ': Failed ', Util_1.getErrorMessage(error));
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
        logger.publishLog(global_config_1.LogLevels.SUCCESS, SERVICE_INSTANCE_ID, ': Subscribed to Shared Topics. Starting Loop.');
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
exports.api = {
    default: normalizer,
    publisher: publisher,
};
