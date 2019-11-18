import { Assets } from "../../../util/backend/CollectionSchemas/assets";
import { Util } from "../../../util/backend/Util";
import { GC } from "../../../util/backend/GlobalConfig";
import {
  publisher,
  bulkPublisher,
  MessageParser
} from "../../../util/backend/Normalizer";
import { Logger } from "../../../util/backend/Logger";

import { normalizer } from "@clearblade/asset-monitor/normalizer";
// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

var util = Util();
// Stub to get incoming data
function getIncomingData(params: any): Object | Array<Object> {
  //Parse data or array of data, so that it can be normalized
  //DEV_TODO
  log(params);
  let updatedData = params;
  return updatedData;
}

export function normalizerUsingLib(
  req: CbServer.BasicReq,
  resp: CbServer.Resp
) {
  
  ClearBlade.init({ request: req });
  // These are parameters passed into the code service
  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
  let params = req.params;
  let logger = Logger();
  let incomingData = params.body;

  var normalizedData = (normalizedData = util.NormalizeData(
    incomingData,
    GC.CUSTOM_CONFIGS.CMX_TO_CB_CONFIG
  ));

  if (!util.IsNormalizedDataValid(normalizedData)) {
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

  //DEV_TODO: An example showing on how to publish on all the default topics
  bulkPublisher(normalizedData);

  //DEV_TODO: (optional) user can publish this data to custom topics as well.
  //NOTE: If LOT of intense tasks are being performed in this code-service,
  //please increase the execution timeout for the service

  resp.success("Success");
}

//@ts-ignore
global.normalizerUsingLib = normalizerUsingLib;
