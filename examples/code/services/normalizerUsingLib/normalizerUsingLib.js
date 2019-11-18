"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../../util/backend/Util");
var GlobalConfig_1 = require("../../../util/backend/GlobalConfig");
var Normalizer_1 = require("../../../util/backend/Normalizer");
var Logger_1 = require("../../../util/backend/Logger");
// @ts-ignore
var ClearBlade = global.ClearBlade;
// @ts-ignore
var log = global.log;
var util = Util_1.Util();
// Stub to get incoming data
function getIncomingData(params) {
    //Parse data or array of data, so that it can be normalized
    //DEV_TODO
    log(params);
    var updatedData = params;
    return updatedData;
}
function normalizerUsingLib(req, resp) {
    ClearBlade.init({ request: req });
    // These are parameters passed into the code service
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
    var params = req.params;
    var logger = Logger_1.Logger();
    var incomingData = params.body;
    var normalizedData = (normalizedData = util.NormalizeData(incomingData, GlobalConfig_1.GC.CUSTOM_CONFIGS.CMX_TO_CB_CONFIG));
    if (!util.IsNormalizedDataValid(normalizedData)) {
        var errMsg = "Normalized Data is invalid";
        logger.publishLog(GlobalConfig_1.GC.LOG_LEVEL.ERROR, "ERROR: ", SERVICE_INSTANCE_ID, ": ", errMsg, "Normalized Message", normalizedData);
        resp.error(errMsg);
    }
    //DEV_TODO: An example showing on how to publish on all the default topics
    Normalizer_1.bulkPublisher(normalizedData);
    //DEV_TODO: (optional) user can publish this data to custom topics as well.
    //NOTE: If LOT of intense tasks are being performed in this code-service,
    //please increase the execution timeout for the service
    resp.success("Success");
}
exports.normalizerUsingLib = normalizerUsingLib;
//@ts-ignore
global.normalizerUsingLib = normalizerUsingLib;
