import { GC, CollectionName } from "../../../backend/global-config";
import { Assets } from "../../../backend/collection-schema/assets";
import { AssetHistory } from "../../../backend/collection-schema/assetHistory";
import { CbCollectionLib } from "../../../backend/collection-lib";
import { Logger } from "../../../backend/Logger";
import { Topics, getAssetIdFromTopic } from "../../../backend/util";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

export function createAssetHistorySS(req:CbServer.BasicReq, resp:CbServer.Resp) {
  const TOPIC = "$share/AssetHistoryGroup/"+ Topics.HistoryAssetLocation("+"); 
  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: "+ SERVICE_INSTANCE_ID);

  ClearBlade.init({ request: req });
  let messaging = ClearBlade.Messaging();
  let logger = Logger();

  messaging.subscribe(TOPIC, WaitLoop);

  function WaitLoop(err: boolean, data: Object) {
      if (err) {
          logger.publishLog(GC.LOG_LEVEL.ERROR, "Subscribe failed for: ", SERVICE_INSTANCE_ID, ": ", data);
          resp.error(data);
      }
      logger.publishLog(GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID, ": Subscribed to Shared Topic. Starting Loop.");

      while (true) {
          messaging.waitForMessage([TOPIC], HandleMessage);
      }
  }
  function HandleMessage(err: boolean, msg: string, topic: string) {
    if (err) {
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, ": Failed to wait for message: ", err, " ", msg, "  ", topic);
        resp.error("Failed to wait for message: "+ err+ " "+ msg+ "    "+ topic);
    }

    try {
        var parsedMsg:Assets = JSON.parse(msg);
    } catch (e) {
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, ": Failed parse the message: ", e);
        // service can exit here if we add resp.error(""), right now it fails silently by just publishing on error topic
        return;
    }
    let asset_history_items:Array<AssetHistory> = [];
    let assetID = getAssetIdFromTopic(topic);
    if (!assetID) {
      logger.publishLog(GC.LOG_LEVEL.ERROR, "Invalid topic received: " + topic);
    }
    
    //asset_type: "", not yet passed in the message, wondering whether it's worth to fetch collection
      let standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
      asset_history_items = asset_history_items.concat(standardHistoryData);

    createCustomHistoryData(assetID, parsedMsg)
    .then(function(value){
        if(value instanceof Array){
          asset_history_items = asset_history_items.concat(value);
        }
        logger.publishLog(GC.LOG_LEVEL.DEBUG, SERVICE_INSTANCE_ID, "HistoryData ", asset_history_items);
        const assetHistoyCol = CbCollectionLib(CollectionName.ASSET_HISTORY);
        return assetHistoyCol.cbCreatePromise({item: asset_history_items })
        
    }).then(successCb, failureCb);
    
    //@ts-ignore
    Promise.runQueue();
  }

  function getEmptyAssetHistoryObject(): AssetHistory {
    let asset_history_data: AssetHistory = {
      change_date: "",
      asset_id: "",
      asset_type: "",
      location_change: false,
      status_change: false,
      attribute_value: "",
      attribute_name: ""
    };
    return asset_history_data;
  }

  function createStandardHistoryData(assetID:string, parsedMsg:Assets):Array<AssetHistory>{
    let asset_history_items:Array<AssetHistory> = [];
    const currDate = new Date().toISOString();
      
    for (let i = 0; i < GC.ASSET_HISTORY_CONFIG.length; i++) {
      let currItem = getEmptyAssetHistoryObject();
      const attribute_name = GC.ASSET_HISTORY_CONFIG[i];
      if (parsedMsg[attribute_name]) {
        currItem["asset_id"] = assetID;
        currItem["attribute_name"] = attribute_name;
        currItem["attribute_value"] = parsedMsg[attribute_name];
        currItem["change_date"] = parsedMsg.last_updated || currDate;
        currItem["asset_type"] = parsedMsg.type;
        currItem["location_change"] = true;
        currItem["status_change"] = false;

        asset_history_items.push(currItem);
      }
    }
    return asset_history_items;
  }

  function createCustomHistoryData(assetID:string, parsedMsg:Assets):Promise<unknown>{
    let customData = parsedMsg["custom_data"]
    let assetTypeID = parsedMsg["type"];

    if (!assetTypeID) {
      logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Invalid assetTypeID received: ", assetTypeID);
      return Promise.reject("Invalid assetTypeID received: " + assetTypeID);
    }
    if(!customData){
      logger.publishLog(GC.LOG_LEVEL.DEBUG, SERVICE_INSTANCE_ID, "Custom Data Missing: ", customData);
      return Promise.resolve([]);
    }
    let assetTypesCol = CbCollectionLib(CollectionName.ASSET_TYPES);
    let assetTypesQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPES }).equalTo("id", assetTypeID);
    let promise = assetTypesCol.cbFetchPromise({ query: assetTypesQuery }).then(function(data){
      if (data.DATA.length <= 0) {
          logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, " No asset type found for id ", assetID, " and type ", assetTypeID);
          return Promise.reject(" No asset type found for id " + assetID + " and type " + assetTypeID);
      }
          
      let schemaStr = data.DATA[0]["schema"];
      try{
        var schema = JSON.parse(schemaStr);
      } catch (e){
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, "Failed while parsing: ", e);
        return Promise.reject("Failed while parsing: " + e);
      }
      let historyData: Array<AssetHistory> = [];
      const currDate = new Date().toISOString();
      
      for (let key of Object.keys(customData)) {
        for(let i = 0; i < schema.length; i++) {
          if(schema[i]["attribute_name"] === key) {
            let currItem = getEmptyAssetHistoryObject();

            currItem["change_date"]= currDate,
            currItem["attribute_name"]= key;
            currItem["asset_id"]= assetID;
            currItem["asset_type"]= assetTypeID;
            currItem["attribute_value"]= customData[key];
            currItem["location_change"] = false;
            currItem["status_change"] = true;

            historyData.push(currItem); 
          }
        }
      }

      return Promise.resolve(historyData);

    });


    return promise;
  }


  function successCb(value) {
    logger.publishLog(GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID , ": AssetHistory Creation Succeeded " , value);
  }

  function failureCb(reason) {
    logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID , ": Failed " , reason);
  }
}

//@ts-ignore
global.createAssetHistorySS = createAssetHistorySS;