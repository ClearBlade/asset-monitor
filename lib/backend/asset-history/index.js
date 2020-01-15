"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var Logger_1 = require("../Logger");
var Util_1 = require("../Util");
var defaultOptions = {
    standardKeysToStore: global_config_1.GC.ASSET_HISTORY_CONFIG.standardKeysToStore,
    customDataKeysToStore: global_config_1.GC.ASSET_HISTORY_CONFIG.customDataKeysToStore,
    LOG_SETTING: global_config_1.GC.ASSET_HISTORY_CONFIG.LOG_SETTING,
};
function createAssetHistorySS(_a) {
    var req = _a.req, resp = _a.resp, _b = _a.options, _c = _b === void 0 ? defaultOptions : _b, _d = _c.standardKeysToStore, standardKeysToStore = _d === void 0 ? defaultOptions.standardKeysToStore : _d, _e = _c.customDataKeysToStore, customDataKeysToStore = _e === void 0 ? defaultOptions.customDataKeysToStore : _e, _f = _c.LOG_SETTING, LOG_SETTING = _f === void 0 ? defaultOptions.LOG_SETTING : _f;
    var TOPIC = '$share/AssetHistoryGroup/' + Util_1.Topics.HistoryAssetLocation('+');
    var SERVICE_INSTANCE_ID = req.service_instance_id;
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    var logger = Logger_1.Logger({ name: 'createAssetHistorySS', logSetting: LOG_SETTING });
    function successCb(value) {
        logger.publishLog(global_config_1.LogLevels.SUCCESS, 'AssetHistory Creation Succeeded ', value);
    }
    function failureCb(reason) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed ', reason);
    }
    function getEmptyAssetHistoryObject() {
        return {
            change_date: '',
            asset_id: '',
            location_change: false,
            status_change: false,
            attribute_value: '',
            attribute_name: '',
        };
    }
    function createStandardHistoryData(assetID, parsedMsg) {
        var assetHistoryItems = [];
        var currDate = new Date().toISOString();
        for (var i = 0; i < standardKeysToStore.length; i++) {
            var currItem = getEmptyAssetHistoryObject();
            var attributeName = standardKeysToStore[i];
            if (parsedMsg[attributeName]) {
                currItem['asset_id'] = assetID;
                currItem['attribute_name'] = attributeName;
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                currItem['attribute_value'] = parsedMsg[attributeName];
                currItem['change_date'] = parsedMsg.last_updated || currDate;
                currItem['location_change'] = true;
                currItem['status_change'] = false;
                assetHistoryItems.push(currItem);
            }
        }
        return assetHistoryItems;
    }
    function createCustomHistoryData(assetID, parsedMsg) {
        var customData = parsedMsg['custom_data'];
        if (!customData) {
            logger.publishLog(global_config_1.LogLevels.DEBUG, 'Custom Data Missing: ', customData);
            return [];
        }
        var historyData = [];
        var currDate = new Date().toISOString();
        var keysToStore = (customDataKeysToStore.length > 0) ? customDataKeysToStore : Object.keys(customData);
        for (var _i = 0, keysToStore_1 = keysToStore; _i < keysToStore_1.length; _i++) {
            var key = keysToStore_1[_i];
            historyData.push(__assign(__assign({}, getEmptyAssetHistoryObject()), { change_date: currDate, attribute_name: key, asset_id: assetID, attribute_value: customData[key], location_change: false, status_change: true }));
        }
        return historyData;
    }
    function HandleMessage(err, msg, topic) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }
        var parsedMsg;
        try {
            parsedMsg = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed parse the message: ', e);
            return;
        }
        var assetHistoryItems = [];
        var assetID = Util_1.getAssetIdFromTopic(topic);
        if (!assetID) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Invalid topic received: ' + topic);
        }
        var standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
        assetHistoryItems = assetHistoryItems.concat(standardHistoryData);
        assetHistoryItems = assetHistoryItems.concat(createCustomHistoryData(assetID, parsedMsg));
        logger.publishLog(global_config_1.LogLevels.DEBUG, 'HistoryData ', assetHistoryItems);
        var assetHistoyCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_HISTORY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        assetHistoyCol.cbCreatePromise({ item: assetHistoryItems }).then(successCb, failureCb);
        Promise.runQueue();
    }
    function WaitLoop(err, data) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Subscribe failed for: ', SERVICE_INSTANCE_ID, ': ', data);
            resp.error(data);
        }
        logger.publishLog(global_config_1.LogLevels.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }
    messaging.subscribe(TOPIC, WaitLoop);
}
exports.createAssetHistorySS = createAssetHistorySS;
