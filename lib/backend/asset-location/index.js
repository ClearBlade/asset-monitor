"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var Logger_1 = require("../Logger");
var Util_1 = require("../Util");
var defaultOptions = {
    KEYS_TO_UPDATE: global_config_1.GC.UPDATE_ASSET_LOCATION_OPTIONS.KEYS_TO_UPDATE,
    LOG_SETTING: global_config_1.GC.UPDATE_ASSET_LOCATION_OPTIONS.LOG_SETTING,
    CREATE_NEW_ASSET_IF_MISSING: global_config_1.GC.UPDATE_ASSET_LOCATION_OPTIONS.CREATE_NEW_ASSET_IF_MISSING,
};
function updateAssetLocationSS(_a) {
    var req = _a.req, resp = _a.resp, _b = _a.options, _c = _b === void 0 ? defaultOptions : _b, _d = _c.KEYS_TO_UPDATE, KEYS_TO_UPDATE = _d === void 0 ? defaultOptions.KEYS_TO_UPDATE : _d, _e = _c.LOG_SETTING, LOG_SETTING = _e === void 0 ? defaultOptions.LOG_SETTING : _e, _f = _c.CREATE_NEW_ASSET_IF_MISSING, CREATE_NEW_ASSET_IF_MISSING = _f === void 0 ? defaultOptions.CREATE_NEW_ASSET_IF_MISSING : _f;
    var TOPIC = '$share/UpdateLocationGroup/' + Util_1.Topics.DBUpdateAssetLocation('+');
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    var logger = Logger_1.Logger({ name: 'AssetLocationSSLib', logSetting: LOG_SETTING });
    //TODO default params in function
    //settings = settings || GC.UPDATE_ASSET_LOCATION_SETTINGS;
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
        for (var i = 0; KEYS_TO_UPDATE && i < KEYS_TO_UPDATE.length; i++) {
            var curKey = KEYS_TO_UPDATE[i];
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
            logger.publishLog(global_config_1.LogLevels.ERROR, ' Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
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
        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);
        var assetID = '';
        if (incomingMsg["id"]) {
            assetID = incomingMsg["id"];
        }
        if (!assetID) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Invalid message received, key: id missing in the payload ', topic, incomingMsg);
            resp.error('Invalid message received, key: id missing in the payload ' + topic);
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
                if (CREATE_NEW_ASSET_IF_MISSING) {
                    createAsset(assetID, incomingMsg).then(successCb, failureCb);
                    logger.publishLog(global_config_1.LogLevels.DEBUG, "Creating Asset since it doesn't exist");
                }
                else {
                    logger.publishLog(global_config_1.LogLevels.ERROR, 'ERROR: ', " Asset doesn't exist so, ignoring: ", data);
                }
            }
            else {
                logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, 'ERROR: ', ' Multiple Assets with same assetId exists: ', data);
            }
        })
            .catch(function (reason) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed to fetch: ', reason);
            resp.error('Failed to fetch asset: ' + reason);
        });
        Promise.runQueue();
    }
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Subscribe failed for: ', SERVICE_INSTANCE_ID, ': ', data);
            resp.error(data);
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
