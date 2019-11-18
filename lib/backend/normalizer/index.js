"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../logger");
var global_config_1 = require("../global-config");
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
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
    var messaging = ClearBlade.Messaging();
    var logger = logger_1.Logger();
    messaging.subscribe(TOPIC, WaitLoop);
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, "Subscribe failed for: ", SERVICE_INSTANCE_ID, ": ", data);
            resp.error(data);
        }
        logger.publishLog(global_config_1.GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Subscribed to Shared Topic. Starting Loop.");
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }
    function HandleMessage(err, msg, topic) {
        var assets = messageParser(err, msg, topic);
        bulkPublisher(assets, publishConfig);
    }
}
exports.normalizer = normalizer;
function bulkPublisher(assets, normalizerPubConfig) {
    if (normalizerPubConfig === void 0) { normalizerPubConfig = global_config_1.GC.NORMALIZER_PUB_CONFIG; }
    Object.keys(normalizerPubConfig).forEach(function (key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}
exports.bulkPublisher = bulkPublisher;
function publisher(assets, pubConfig) {
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
