import {
  GC,
  CollectionName
} from "@clearblade/asset-monitor/lib/backend/global-config";
import { CbCollectionLib } from "@clearblade/asset-monitor/lib/backend/collection-lib";
import { Logger } from "@clearblade/asset-monitor/lib/backend/logger";
import { getAssetIdFromTopic, Topics } from "@clearblade/asset-monitor/lib/backend/util";
import { Assets } from "@clearblade/asset-monitor/lib/backend/collection-schema/assets";


// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

// @ts-ignore
var log: { (s: any): void } = global.log;

export function updateAssetStatusSS(req: CbServer.BasicReq, resp: CbServer.Resp) {
  ClearBlade.init({ request: req });

  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: "+SERVICE_INSTANCE_ID);
  const TOPIC = "$share/AssetStatusGroup/"+ Topics.DBUpdateAssetStatus("+");
  let logger = Logger();

  let messaging = ClearBlade.Messaging();
  

  messaging.subscribe(TOPIC, WaitLoop);
  function WaitLoop(err: boolean, data: CbServer.Resp): void {
    if (err) {
      logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Subscribe failed ",data);
      resp.error(data);
    }
    logger.publishLog(GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Subscribed to Shared Topic. Starting Loop.");

    while (true) {
      messaging.waitForMessage([TOPIC], handleMessage);
    }
  }
  
  function handleMessage(err:boolean, msg: string, topic: string): void {
    if (err) {
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID,"Failed to wait for message: ", err, " ", msg, "  ", topic);
        resp.error("Failed to wait for message: " + err + " " + msg + "    " + topic);
    }

    try{
      var jsonMessage = JSON.parse(msg);
    } catch(e){
      logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Failed while parsing: ", e);
      return ;
    }

    let assetID = getAssetIdFromTopic(topic);
    if(!assetID){
       logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID,"Invalid topic received: ", topic);
       resp.error("Invalid topic received: " + topic);
    }

    MergeAsset(assetID, jsonMessage)
    .catch(failureCb);

    //@ts-ignore
    Promise.runQueue();
    
  }

  function updateAsset(assetID: string, msg: Object): Promise<unknown> {
    let assetsCol = CbCollectionLib(CollectionName.ASSETS);
    let assetsQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo("id", assetID);
    let statusChanges = { custom_data: JSON.stringify(msg["custom_data"]) };
    return assetsCol.cbUpdatePromise({
      query: assetsQuery,
      changes: statusChanges
    });
  }

  function MergeAsset(assetID: string, msg: Object): Promise<unknown> {
    let assetsCol = CbCollectionLib(CollectionName.ASSETS);
    let assetFetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPES }).equalTo("id", assetID);
    let promise = assetsCol.cbFetchPromise({ query: assetFetchQuery }).then(function(data){
      if (data.DATA.length <= 0) {
          logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, " No asset type found for id ", assetID, " and type ", assetID);
          return Promise.reject(" No asset type found for id " + assetID + " and type " + assetID);
      }
      if (data.DATA.length > 1) {
          logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, " Multiple Assets found for id ", assetID);
          return Promise.reject(" Multiple Assets found for id " + assetID);
      }
            
      let dataStr = data.DATA[0]["custom_data"];
      try{
        var customData = JSON.parse(dataStr);
      } catch (e){
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Failed while parsing: ", e);
        return Promise.reject("Failed while parsing: " + e);
      }
      var incomingCustomData = msg["custom_data"];
      for (let key of Object.keys(incomingCustomData)) {    
        customData[key] = incomingCustomData[key];
      }

      const currDate = new Date().toISOString();  
      let assetsQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo("id", assetID);
      let statusChanges:Assets = { "custom_data": JSON.stringify(customData), "last_updated":currDate};
        return assetsCol.cbUpdatePromise({
          query: assetsQuery,
          changes: statusChanges
      });

    });


    return promise;
  }
  

  
  function failureCb(reason) {
      logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, ": Failed ", reason);
  }

  function successCb(value) {
      logger.publishLog(GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Succeeded ", value);
  }

}

// @ts-ignore
global.updateAssetStatusSS = updateAssetStatusSS;
