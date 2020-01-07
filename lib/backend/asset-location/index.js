"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var Logger_1 = require("../Logger");
var Util_1 = require("../Util");
function updateAssetLocationSS(config) {
    var TOPIC = '$share/UpdateLocationGroup/' + Util_1.Topics.DBUpdateAssetLocation('+');
    var SERVICE_INSTANCE_ID = config.req.service_instance_id;
    ClearBlade.init({ request: config.req });
    var messaging = ClearBlade.Messaging();
    var logger = Logger_1.Logger({ name: 'updateAssetLocationSS' });
    function successCb(value) {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.SUCCESS, 'Succeeded ', value);
    }
    function failureCb(reason) {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'Failed ', reason);
    }
    function updateAssetLocation(assetsOpts) {
        var currentState = assetsOpts.fetchedData;
        var incomingMsg = assetsOpts.incomingMsg;
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, 'DEBUG: ', 'In Update Asset Location');
        if (!currentState.item_id) {
            return Promise.reject('Item Id is missing');
        }
        var query = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('item_id', currentState.item_id);
        var changes = {};
        for (var i = 0; i < global_config_1.GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate.length; i++) {
            var curKey = global_config_1.GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate[i];
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            changes[curKey] = incomingMsg[curKey];
        }
        //DEV_TODO: optional/debatable, setting the date
        var date = new Date().toISOString();
        changes['last_location_updated'] = changes['last_location_updated'] ? changes['last_location_updated'] : date;
        changes['last_updated'] = changes['last_updated'] ? changes['last_updated'] : date;
        //DEV_TODO comment the logs once the entire flow works or
        // just change the LOG_LEVEL to info in the custom_config
        logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, 'DEBUG: logging changes: ', changes);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return assetsCol.cbUpdatePromise({ query: query, changes: changes });
    }
    function createAsset(assetID, assetData) {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, 'DEBUG: ', 'in Create Asset');
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        var newAsset = assetData;
        //DEV_TODO: optional/debatable, setting the date
        var date = new Date().toISOString();
        newAsset['last_location_updated'] = newAsset['last_location_updated']
            ? newAsset['last_location_updated']
            : date;
        newAsset['last_updated'] = newAsset['last_updated'] ? newAsset['last_updated'] : date;
        newAsset['id'] = assetID;
        try {
            newAsset['custom_data'] = JSON.stringify(assetData['custom_data']);
        }
        catch (e) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'ERROR: ', SERVICE_INSTANCE_ID, ': Failed to stringify ', e);
            return Promise.reject('Failed to stringify ' + e);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return assetsCol.cbCreatePromise({ item: [newAsset] });
    }
    function HandleMessage(err, msg, topic) {
        if (err) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, ' Failed to wait for message: ', err, ' ', msg, '  ', topic);
            config.resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }
        var incomingMsg;
        try {
            incomingMsg = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'Failed parse the message: ', e);
            // service can exit here if we add resp.error(""), right now it fails silently by just publishing on error topic
            return;
        }
        var assetID = Util_1.getAssetIdFromTopic(topic);
        if (!assetID) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'Invalid topic received: ', topic);
            return;
        }
        var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', assetID);
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        assetsCol
            .cbFetchPromise({ query: fetchQuery })
            .then(function (data) {
            if (data.DATA.length === 1) {
                var fetchedData = data.DATA[0];
                updateAssetLocation({ fetchedData: fetchedData, incomingMsg: incomingMsg }).then(successCb, failureCb);
            }
            else if (data.DATA.length === 0) {
                createAsset(assetID, incomingMsg).then(successCb, failureCb);
                logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'ERROR: ', " Asset doesn't exist so, ignoring: ", data);
            }
            else {
                logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'ERROR: ', ' Multiple Assets with same assetId exists: ', data);
            }
        })
            .catch(function (reason) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'Failed to fetch: ', reason);
            config.resp.error('Failed to fetch asset: ' + reason);
        });
        Promise.runQueue();
    }
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'Subscribe failed for: ', SERVICE_INSTANCE_ID, ': ', data);
            config.resp.error(data);
        }
        logger.publishLog(global_config_1.GC.LOG_LEVEL.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }
    messaging.subscribe(TOPIC, WaitLoop);
}
exports.updateAssetLocationSS = updateAssetLocationSS;
