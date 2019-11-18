import {
  normalizer,
  MessageParser
} from "asset-monitor/lib/backend/normalizer";
import {
  normalizeData,
  isNormalizedDataValid
} from "asset-monitor/lib/backend/util";
import { Logger } from "asset-monitor/lib/backend/logger";
import { GC } from "asset-monitor/lib/backend/global-config";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

function normalizerUsingLibSS(req: CbServer.BasicReq, resp: CbServer.Resp) {
  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
  let topics = ["$share/mygroup/cmx_device"];
  ClearBlade.init({ request: req });
  let logger = Logger();

  let messageParser: MessageParser = function(err, msg, topic) {
    try {
      var incomingData = JSON.parse(msg);
    } catch (e) {
      logger.publishLog(
        GC.LOG_LEVEL.ERROR,
        SERVICE_INSTANCE_ID,
        "Failed while parsing: ",
        e
      );
      return [];
    }
    var normalizedData = [];
    switch (topic) {
      case "$share/mygroup/cmx_device":
        normalizedData = normalizeData(
          incomingData,
          GC.CUSTOM_CONFIGS.CMX_TO_CB_CONFIG
        );
        break;
      case "$share/mygroup/jims_railcart":
        // normalizedData = NormalizeData(
        //   incomingData,
        //   GC.CUSTOM_CONFIGS.RAILCART_TO_CB_CONFIG
        // );
        break;
    }

    if (!isNormalizedDataValid(normalizedData)) {
      let errMsg = "Normalized Data is invalid";
      logger.publishLog(
        GC.LOG_LEVEL.ERROR,
        "ERROR: ",
        SERVICE_INSTANCE_ID,
        ": ",
        errMsg,
        "Normalized Message",
        normalizedData
      );
      resp.error(errMsg);
    }
    return normalizedData;
  };

  // Add default publish config
  let publishConfig = {
    locationTopic: GC.NORMALIZER_PUB_CONFIG.locationConfig
  };

  normalizer({
    req,
    resp,
    messageParser,
    topics,
    normalizerPubConfig: publishConfig
  });
}

//@ts-ignore
global.normalizerUsingLibSS = normalizerUsingLibSS;
