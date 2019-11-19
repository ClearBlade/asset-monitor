import { GC, CollectionName } from "@clearblade/asset-monitor/lib/backend/global-config";
import { Assets } from "@clearblade/asset-monitor/lib/backend/collection-schema/assets";
import { CbCollectionLib } from "@clearblade/asset-monitor/lib/backend/collection-lib";
import { Logger } from "@clearblade/asset-monitor/lib/backend/logger";
import { Topics, getAssetIdFromTopic } from "@clearblade/asset-monitor/lib/backend/util";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;

interface UpdateAssetLocationOptions {
    fetchedData:Assets; 
    incomingMsg:Assets;
}

/**
 * The service updates if an asset exists and 
 * if the asset doesn't exist, developer can search for DEV_TODOs 
 * and uncomment the code to enable that functionality
 * @param req 
 * @param resp 
 */
export function updateAssetLocationSS(req: CbServer.BasicReq, resp:CbServer.Resp) {
    const TOPIC = "$share/UpdateLocationGroup/"+ Topics.DBUpdateAssetLocation("+"); 
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
            var incomingMsg:Assets = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID, ": Failed parse the message: ", e);
            // service can exit here if we add resp.error(""), right now it fails silently by just publishing on error topic
            return;
        }

        let assetID = getAssetIdFromTopic(topic);
        
        if(!assetID){
            logger.publishLog(GC.LOG_LEVEL.ERROR,"Invalid topic received: " ,topic);
            return;
        }

        let fetchQuery = ClearBlade.Query({ "collectionName": CollectionName.ASSETS }).equalTo("id", assetID);
        let assetsCol = CbCollectionLib(CollectionName.ASSETS);

        assetsCol.cbFetchPromise({ query: fetchQuery })
            .then(function (data) {
                if (data.DATA.length === 1) {
                    const fetchedData:Assets = data.DATA[0];
                    updateAssetLocation({ fetchedData, incomingMsg })
                        .then(successCb, failureCb);

                } else if(data.DATA.length === 0){
                    //DEV_TODO uncomment to the lines below to create a new asset if it doesn't exist
                    // YJ_TODO Add a boolean to make it configurable in Global/Custom Config
                    // createAsset(assetID, incomingMsg)
                    //     .then(successCb, failureCb);
                    //logger.publishLog(GC.LOG_LEVEL.ERROR, "ERROR: ", SERVICE_INSTANCE_ID , ": Asset doesn't exist so, ignoring: ", data);
                } else {
                    logger.publishLog(GC.LOG_LEVEL.ERROR, "ERROR: ", SERVICE_INSTANCE_ID , ": Multiple Assets with same assetId exists: ", data);
                }
            })
            .catch(function (reason) {
                logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID , ": Failed to fetch: " , reason);
                resp.error("Failed to fetch asset: " + reason);
            });
        
        //@ts-ignore
        Promise.runQueue();
    }

    function updateAssetLocation(assetsOpts: UpdateAssetLocationOptions): Promise<unknown> {
        const currentState = assetsOpts.fetchedData;
        const incomingMsg = assetsOpts.incomingMsg;
        let assetsCol = CbCollectionLib(CollectionName.ASSETS);
        
        logger.publishLog(GC.LOG_LEVEL.DEBUG, "DEBUG: ", SERVICE_INSTANCE_ID , ": In Update Asset Location");
        if (!currentState.item_id) {
            return Promise.reject("Item Id is missing");
        }
        let query = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo("item_id", currentState.item_id);
        let changes:Assets = {};

        for (let i = 0; i < GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate.length; i++) {
          const curKey = GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate[i];
          changes[curKey] = incomingMsg[curKey];
        }
        
        //DEV_TODO: optional/debatable, setting the date
        const date = new Date().toISOString();
        changes["last_location_updated"] = (changes["last_location_updated"])?changes["last_location_updated"]:date;
        changes["last_updated"] = (changes["last_updated"])?changes["last_updated"]:date;
        
        //DEV_TODO comment the logs once the entire flow works or 
        // just change the LOG_LEVEL to info in the custom_config
        logger.publishLog(GC.LOG_LEVEL.DEBUG, "DEBUG: logging changes: ", changes);
        return assetsCol.cbUpdatePromise({ query, changes });
    }

    function createAsset(assetID:string, assetData:Assets):Promise<unknown> {
        logger.publishLog(GC.LOG_LEVEL.DEBUG, "DEBUG: ", SERVICE_INSTANCE_ID , ": In Create Asset");

        let assetsCol = CbCollectionLib(CollectionName.ASSETS);
        let newAsset = assetData;
        
        //DEV_TODO: optional/debatable, setting the date
        const date = new Date().toISOString();
        newAsset["last_location_updated"] = (newAsset["last_location_updated"])?newAsset["last_location_updated"]:date;
        newAsset["last_updated"] = (newAsset["last_updated"])?newAsset["last_updated"]:date;
        newAsset["id"] = assetID;
        try {
            newAsset["custom_data"] = JSON.stringify(assetData["custom_data"]);
        } catch (e) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, "ERROR: ", SERVICE_INSTANCE_ID , ": Failed to stringify " , e);
            return Promise.reject("Failed to stringify " + e);
        }
        return assetsCol.cbCreatePromise({ item: [newAsset] });
    }

    function successCb(value) {
        logger.publishLog(GC.LOG_LEVEL.SUCCESS, SERVICE_INSTANCE_ID,": Succeeded ",value);
    }

    function failureCb(reason) {
        logger.publishLog(GC.LOG_LEVEL.ERROR, SERVICE_INSTANCE_ID,": Failed ",reason);
    }

}

//@ts-ignore
global.updateAssetLocationSS = updateAssetLocationSS;