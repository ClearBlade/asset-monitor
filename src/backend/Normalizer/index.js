"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../Util");
var Logger_1 = require("../Logger");
var GlobalConfig_1 = require("../GlobalConfig");
// @ts-ignore
var ClearBlade = global.ClearBlade;
// @ts-ignore
var log = global.log;
var util = Util_1.Util();
exports.api = {
    default: normalizer,
    publisher: publisher
};
function normalizer(config) {
    var resp = config.resp;
    var req = config.req;
    var messageParser = config.messageParser;
    var topics = config.topics;
    var publishConfig = config.normalizerPubConfig || GlobalConfig_1.GC.NORMALIZER_PUB_CONFIG;
    var TOPIC = topics[0];
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
    var messaging = ClearBlade.Messaging();
    var logger = Logger_1.Logger();
    messaging.subscribe(TOPIC, WaitLoop);
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(GlobalConfig_1.GC.LOG_LEVEL.ERROR, "Subscribe failed for: ", SERVICE_INSTANCE_ID, ": ", data);
            resp.error(data);
        }
        logger.publishLog(GlobalConfig_1.GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Subscribed to Shared Topic. Starting Loop.");
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
    if (normalizerPubConfig === void 0) { normalizerPubConfig = GlobalConfig_1.GC.NORMALIZER_PUB_CONFIG; }
    Object.keys(normalizerPubConfig).forEach(function (key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}
exports.bulkPublisher = bulkPublisher;
function publisher(assets, pubConfig) {
    var messaging = ClearBlade.Messaging();
    var _loop_1 = function (i, l) {
        var assetID = assets[i]["id"];
        var topic = pubConfig.topicFn(assetID);
        var pubData = {};
        pubConfig.keysToPublish.forEach(function (value) {
            pubData[value] = assets[i][value];
        });
        messaging.publish(topic, JSON.stringify(pubData));
    };
    for (var i = 0, l = assets.length; i < l; i++) {
        _loop_1(i, l);
    }
}
exports.publisher = publisher;
