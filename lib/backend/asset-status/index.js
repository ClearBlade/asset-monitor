"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var Logger_1 = require("../Logger");
var Util_1 = require("../Util");
var Normalizer_1 = require("../Normalizer");
require("../../static/promise-polyfill");
var defaultOptions = {
    LOG_SETTING: global_config_1.GC.UPDATE_ASSET_STATUS_OPTIONS.LOG_SETTING,
    UPDATE_METHOD: global_config_1.GC.UPDATE_ASSET_STATUS_OPTIONS.UPDATE_METHOD,
};
function updateAssetStatusSS(_a) {
    var req = _a.req, resp = _a.resp, _b = _a.options, _c = _b === void 0 ? defaultOptions : _b, _d = _c.LOG_SETTING, LOG_SETTING = _d === void 0 ? defaultOptions.LOG_SETTING : _d, _e = _c.UPDATE_METHOD, UPDATE_METHOD = _e === void 0 ? defaultOptions.UPDATE_METHOD : _e;
    ClearBlade.init({ request: req });
    var TOPIC = '$share/AssetStatusGroup/' + Util_1.Topics.DBUpdateAssetStatus('+');
    var logger = Logger_1.Logger({ name: 'AssetStatusSSLib', logSetting: LOG_SETTING });
    var messaging = ClearBlade.Messaging();
    function failureCb(error) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed ', Util_1.getErrorMessage(error.message));
    }
    function MergeAsset(assetID, msg) {
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        var assetFetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', assetID);
        var promise = assetsCol.cbFetchPromise({ query: assetFetchQuery }).then(function (data) {
            if (data.DATA.length <= 0) {
                //TODO think of a better way to handle this
                logger.publishLog(global_config_1.LogLevels.ERROR, 'No asset found for id ', assetID);
                return Promise.reject(new Error('No asset found for id ' + assetID));
            }
            if (data.DATA.length > 1) {
                logger.publishLog(global_config_1.LogLevels.ERROR, 'Multiple Assets found for id ', assetID);
                return Promise.reject(new Error('Multiple Assets found for id ' + assetID));
            }
            var dataStr = data.DATA[0]['custom_data'];
            var customData;
            try {
                customData = JSON.parse(dataStr);
            }
            catch (e) {
                logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed while parsing: ', e.message);
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
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
                changes: statusChanges,
            });
        });
        return promise;
    }
    function handleMessage(err, msg, topic) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }
        var jsonMessage;
        try {
            jsonMessage = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed while parsing: ', e.message);
            return;
        }
        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);
        var assetID = '';
        if (jsonMessage['id']) {
            assetID = jsonMessage['id'];
        }
        if (!assetID) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Invalid message received, key: id missing in the payload ', topic, jsonMessage);
            resp.error('Invalid message received, key: id missing in the payload ' + topic);
        }
        if (UPDATE_METHOD === global_config_1.AssetStatusUpdateMethod.MERGE) {
            MergeAsset(assetID, jsonMessage).catch(failureCb);
        }
        else {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'AssetStatus update method ', UPDATE_METHOD, 'Not supported. Hence, no updates performed');
        }
        Promise.runQueue();
    }
    function WaitLoop() {
        logger.publishLog(global_config_1.LogLevels.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], handleMessage);
        }
    }
    Normalizer_1.bulkSubscriber(__spreadArrays([TOPIC], (!ClearBlade.isEdge() ? [TOPIC + '/_platform'] : [])))
        .then(function () {
        WaitLoop();
    })
        .catch(function (e) {
        log("Subscription error: " + e.message);
        resp.error("Subscription error: " + e.message);
    });
    Promise.runQueue();
}
exports.updateAssetStatusSS = updateAssetStatusSS;
