"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../../util/backend/Util");
var Normalizer_1 = require("../../../util/backend/Normalizer");
var GlobalConfig_1 = require("../../../util/backend/GlobalConfig");
var Logger_1 = require("../../../util/backend/Logger");
// @ts-ignore
var ClearBlade = global.ClearBlade;
// @ts-ignore
var log = global.log;
var util = Util_1.Util();
function normalizerUsingLibSS(req, resp) {
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
    var topics = ["$share/mygroup/cmx_device"];
    ClearBlade.init({ request: req });
    var logger = Logger_1.Logger();
    var messageParser = function (err, msg, topic) {
        try {
            var incomingData = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(GlobalConfig_1.GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Failed while parsing: ", e);
            return [];
        }
        var normalizedData = [];
        switch (topic) {
            case "$share/mygroup/cmx_device":
                normalizedData = util.NormalizeData(incomingData, GlobalConfig_1.GC.CUSTOM_CONFIGS.CMX_TO_CB_CONFIG);
                break;
            case "$share/mygroup/jims_railcart":
                // normalizedData = util.NormalizeData(
                //   incomingData,
                //   GC.CUSTOM_CONFIGS.RAILCART_TO_CB_CONFIG
                // );
                break;
        }
        if (!util.IsNormalizedDataValid(normalizedData)) {
            var errMsg = "Normalized Data is invalid";
            logger.publishLog(GlobalConfig_1.GC.LOG_LEVEL.ERROR, "ERROR: ", SERVICE_INSTANCE_ID, ": ", errMsg, "Normalized Message", normalizedData);
            resp.error(errMsg);
        }
        return normalizedData;
    };
    // Add default publish config
    var publishConfig = {
        locationTopic: GlobalConfig_1.GC.NORMALIZER_PUB_CONFIG.locationConfig
    };
    Normalizer_1.normalizer({ req: req, resp: resp, messageParser: messageParser, topics: topics, normalizerPubConfig: publishConfig });
}
//@ts-ignore
global.normalizerUsingLibSS = normalizerUsingLibSS;
