"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var Logger_1 = require("../Logger");
var Util_1 = require("../Util");
function updateAssetStatusSS(config) {
    ClearBlade.init({ request: config.req });
    var TOPIC = '$share/AssetStatusGroup/' + Util_1.Topics.DBUpdateAssetStatus('+');
    var logger = Logger_1.Logger({ name: 'updateAssetStatusSS' });
    var messaging = ClearBlade.Messaging();
    config.settings = config.settings || global_config_1.GC.UPDATE_ASSET_STATUS_SETTINGS;
    function failureCb(reason) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed ', reason);
    }
    function MergeAsset(assetID, msg) {
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        var assetFetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', assetID);
        var promise = assetsCol.cbFetchPromise({ query: assetFetchQuery }).then(function (data) {
            if (data.DATA.length <= 0) {
                logger.publishLog(global_config_1.LogLevels.ERROR, 'No asset found for id ', assetID);
                return Promise.reject(' No asset found for id ' + assetID);
            }
            if (data.DATA.length > 1) {
                logger.publishLog(global_config_1.LogLevels.ERROR, 'Multiple Assets found for id ', assetID);
                return Promise.reject(' Multiple Assets found for id ' + assetID);
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            var dataStr = data.DATA[0]['custom_data'];
            var customData;
            try {
                customData = JSON.parse(dataStr);
            }
            catch (e) {
                logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed while parsing: ', e);
                return Promise.reject('Failed while parsing: ' + e);
            }
            var incomingCustomData = msg['custom_data'];
            for (var _i = 0, _a = Object.keys(incomingCustomData); _i < _a.length; _i++) {
                var key = _a[_i];
                customData[key] = incomingCustomData[key];
            }
            var currDate = new Date().toISOString();
            var assetsQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', assetID);
            var statusChanges = { custom_data: JSON.stringify(customData), last_updated: currDate };
            return assetsCol.cbUpdatePromise({
                query: assetsQuery,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                changes: statusChanges,
            });
        });
        return promise;
    }
    function handleMessage(err, msg, topic) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            config.resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }
        var jsonMessage;
        try {
            jsonMessage = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed while parsing: ', e);
            return;
        }
        var assetID = Util_1.getAssetIdFromTopic(topic);
        if (!assetID) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Invalid topic received: ', topic);
            config.resp.error('Invalid topic received: ' + topic);
        }
        if (config.settings.UPDATE_METHOD == global_config_1.AssetStatusUpdateMethod.MERGE) {
            MergeAsset(assetID, jsonMessage).catch(failureCb);
        }
        else {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'AssetStatus update method ', config.settings.UPDATE_METHOD, 'Not supported. Hence, no updates performed');
        }
        Promise.runQueue();
    }
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Subscribe failed ', data);
            config.resp.error(data);
        }
        logger.publishLog(global_config_1.LogLevels.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], handleMessage);
        }
    }
    messaging.subscribe(TOPIC, WaitLoop);
}
exports.updateAssetStatusSS = updateAssetStatusSS;
exports.api = {
    default: updateAssetStatusSS,
};
