import {
  bulkPublisher,
} from "@clearblade/asset-monitor/lib/backend/normalizer";
import {
  normalizeData,
  isNormalizedDataValid
} from "@clearblade/asset-monitor/lib/backend/util";
import { Logger } from "@clearblade/asset-monitor/lib/backend/logger";
import {
  GC,
  NormalizerDeviceMap
} from "@clearblade/asset-monitor/lib/backend/global-config";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

let DEVICE_TO_CB_CONFIG: NormalizerDeviceMap = {
  location_x: "locationCoordinate.x",
  location_y: "locationCoordinate.y",
  location_z: "locationCoordinate.z",
  location_unit: "locationCoordinate.unit",
  location_type: "INDOOR/GPS",
  geo_latitude: "geoCoordinate.latitude",
  geo_longitude: "geoCoordinate.longitude",
  geo_altitude: "",
  geo_unit: "geoCoordinate.unit",
  last_updated: "lastSeen",
  last_location_updated: "lastSeen",
  id: "deviceId",
  type: "type"
};

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

  var normalizedData = (normalizedData = normalizeData(
    incomingData,
    DEVICE_TO_CB_CONFIG
  ));

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

  //DEV_TODO: An example showing on how to publish on all the default topics
  bulkPublisher(normalizedData);

  //DEV_TODO: (optional) user can publish this data to custom topics as well.
  //NOTE: If LOT of intense tasks are being performed in this code-service,
  //please increase the execution timeout for the service

  resp.success("Success");
}

//@ts-ignore
global.normalizerUsingLib = normalizerUsingLib;
