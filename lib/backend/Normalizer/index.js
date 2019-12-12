"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../logger");
var global_config_1 = require("../global-config");
require("../../static/promise-polyfill/index.js");
// @ts-ignore
var ClearBlade = global.ClearBlade;
// @ts-ignore
var log = global.log;
exports.api = {
    default: normalizer,
    publisher: publisher
};
function normalizer(config) {
    var resp = config.resp;
    var req = config.req;
    var messageParser = config.messageParser;
    var topics = config.topics;
    var publishConfig = config.normalizerPubConfig || global_config_1.GC.NORMALIZER_PUB_CONFIG;
    var TOPIC = topics[0];
    // @ts-ignore - bad Clark
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    // @ts-ignore - bad Clark
    var messaging = ClearBlade.Messaging();
    var logger = logger_1.Logger();
    logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, "Normalizer SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
    var subscribePromises = [];
    for (var i = 0, l = topics.length; i < l; i++) {
        subscribePromises.push(subscriber(topics[i]));
    }
    Promise.all(subscribePromises)
        .then(WaitLoop)
        .catch(failureCb);
    //@ts-ignore
    Promise.runQueue();
    function WaitLoop() {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Subscribed to Shared Topic. Starting Loop.");
        while (true) {
            // @ts-ignore - bad Clark
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }
    function HandleMessage(err, msg, topic) {
        //promisifying
        messageParser(err, msg, topic)
            .then(function (assets) {
            bulkPublisher(assets, publishConfig);
        })
            .catch(failureCb);
        // @ts-ignore
        Promise.runQueue();
        //maybe TODO: give a callback
    }
    function failureCb(reason) {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, ": Failed ", reason);
    }
}
exports.normalizer = normalizer;
function subscriber(topic) {
    // @ts-ignore - bad Clark
    var messaging = ClearBlade.Messaging();
    var promise = new Promise(function (resolve, reject) {
        // @ts-ignore - bad Clark
        messaging.subscribe(topic, function (err, data) {
            if (err) {
                reject("Error with subscribing" + data);
            }
            else {
                resolve(data);
            }
        });
    });
    return promise;
}
exports.subscriber = subscriber;
function bulkPublisher(assets, normalizerPubConfig) {
    if (normalizerPubConfig === void 0) { normalizerPubConfig = global_config_1.GC.NORMALIZER_PUB_CONFIG; }
    Object.keys(normalizerPubConfig).forEach(function (key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}
exports.bulkPublisher = bulkPublisher;
function publisher(assets, pubConfig) {
    // @ts-ignore - bad Clark
    var messaging = ClearBlade.Messaging();
    var _loop_1 = function (i, l) {
        var assetID = assets[i]["id"];
        //@ts-ignore
        var topic = pubConfig.topicFn(assetID);
        var pubData = {};
        pubConfig.keysToPublish.forEach(function (value) {
            //@ts-ignore
            pubData[value] = assets[i][value];
        });
        messaging.publish(topic, JSON.stringify(pubData));
    };
    for (var i = 0, l = assets.length; i < l; i++) {
        _loop_1(i, l);
    }
}
exports.publisher = publisher;
