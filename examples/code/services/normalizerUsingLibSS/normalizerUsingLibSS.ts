import { normalizer, MessageParser } from "../../../../lib/backend/normalizer";
import { GC } from "../../../../lib/backend/global-config";
import {
  normalizeData,
  isNormalizedDataValid
} from "../../../../lib/backend/util";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

function normalizerUsingLibSS(req: CbServer.BasicReq, resp: CbServer.Resp) {
  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
  let topics = ["$share/mygroup/cmx_device"];
  ClearBlade.init({ request: req });

  let messageParser: MessageParser = function(err, msg, topic) {
    if(err){
      return Promise.reject([]);
    }
    try {
      var incomingData = JSON.parse(msg);
    } catch (e) {
      return Promise.reject("Failed while parsing"+e);
    }
    var normalizedData = [];
    switch (topic) {
      case "$share/mygroup/cmx_device":
        normalizedData = normalizeData(incomingData, GC.CUSTOM_CONFIGS.CMX_TO_CB_CONFIG);
        break;
      case "$share/mygroup/jims_railcart":
        // normalizedData = normalizeData(
        //   incomingData,
        //   GC.CUSTOM_CONFIGS.RAILCART_TO_CB_CONFIG
        // );
        break;
    }

    if (!isNormalizedDataValid(normalizedData)) {
      let errMsg = "Normalized Data is invalid";
      return Promise.reject(errMsg);
    }
    return Promise.resolve(normalizedData);
  };

  // Add default publish config
  let publishConfig = {
    locationTopic: GC.NORMALIZER_PUB_CONFIG.locationConfig
  };
  
  normalizer({ req, resp, messageParser, topics, normalizerPubConfig: publishConfig });
}

//@ts-ignore
global.normalizerUsingLibSS = normalizerUsingLibSS;
