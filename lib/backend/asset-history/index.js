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
require("@clearblade/promise-polyfill");
var defaultOptions = {
    STANDARD_KEYS_TO_STORE: global_config_1.GC.ASSET_HISTORY_CONFIG.STANDARD_KEYS_TO_STORE,
    CUSTOM_DATA_KEYS_TO_STORE: global_config_1.GC.ASSET_HISTORY_CONFIG.CUSTOM_DATA_KEYS_TO_STORE,
    STANDARD_KEY_STORAGE_SETTING: global_config_1.GC.ASSET_HISTORY_CONFIG.STANDARD_KEY_STORAGE_SETTING,
    CUSTOM_DATA_KEY_STORAGE_SETTING: global_config_1.GC.ASSET_HISTORY_CONFIG.CUSTOM_DATA_KEY_STORAGE_SETTING,
    LOG_SETTING: global_config_1.GC.ASSET_HISTORY_CONFIG.LOG_SETTING,
    LOG_SERVICE_NAME: 'AssetHistoryServiceNameUnset',
};
function createAssetHistorySS(_a) {
    var req = _a.req, resp = _a.resp, _b = _a.options, _c = _b === void 0 ? defaultOptions : _b, _d = _c.STANDARD_KEYS_TO_STORE, STANDARD_KEYS_TO_STORE = _d === void 0 ? defaultOptions.STANDARD_KEYS_TO_STORE : _d, _e = _c.CUSTOM_DATA_KEYS_TO_STORE, CUSTOM_DATA_KEYS_TO_STORE = _e === void 0 ? defaultOptions.CUSTOM_DATA_KEYS_TO_STORE : _e, _f = _c.LOG_SETTING, LOG_SETTING = _f === void 0 ? defaultOptions.LOG_SETTING : _f, _g = _c.LOG_SERVICE_NAME, LOG_SERVICE_NAME = _g === void 0 ? defaultOptions.LOG_SERVICE_NAME : _g, _h = _c.CUSTOM_DATA_KEY_STORAGE_SETTING, CUSTOM_DATA_KEY_STORAGE_SETTING = _h === void 0 ? defaultOptions.CUSTOM_DATA_KEY_STORAGE_SETTING : _h, _j = _c.STANDARD_KEY_STORAGE_SETTING, STANDARD_KEY_STORAGE_SETTING = _j === void 0 ? defaultOptions.STANDARD_KEY_STORAGE_SETTING : _j;
    var TOPIC = '$share/AssetHistoryGroup/' + Util_1.Topics.HistoryAssetLocation('+');
    var TOPICS = __spreadArrays([TOPIC], (!ClearBlade.isEdge() ? [TOPIC + '/_platform'] : []));
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    var logger = new Logger_1.Logger({ name: LOG_SERVICE_NAME, logSetting: LOG_SETTING });
    function successCb(value) {
        logger.publishLog(global_config_1.LogLevels.INFO, 'AssetHistory Creation Succeeded ', value);
    }
    function failureCb(error) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed ', Util_1.getErrorMessage(error.message));
    }
    function getEmptyAssetHistoryObject() {
        return {
            change_date: '',
            asset_id: '',
            location_change: false,
            status_change: false,
            attribute_value: '',
            attribute_name: '',
            asset_type: '',
        };
    }
    function createStandardHistoryData(assetID, parsedMsg) {
        var assetHistoryItems = [];
        var currDate = new Date().toISOString();
        if (STANDARD_KEY_STORAGE_SETTING === global_config_1.KeyStorageSettings.NO ||
            STANDARD_KEY_STORAGE_SETTING === global_config_1.KeyStorageSettings.ALL) {
            return [];
        }
        //Implied the setting is CUSTOM
        if (STANDARD_KEYS_TO_STORE && STANDARD_KEYS_TO_STORE.length <= 0) {
            return [];
        }
        logger.publishLog(global_config_1.LogLevels.TRACE, 'STANDARD_KEYS_TO_STORE Data: ', STANDARD_KEYS_TO_STORE);
        for (var i = 0; i < STANDARD_KEYS_TO_STORE.length; i++) {
            var currItem = getEmptyAssetHistoryObject();
            var attributeName = STANDARD_KEYS_TO_STORE[i];
            var attributeValue = parsedMsg[attributeName];
            if (typeof attributeValue !== 'undefined') {
                currItem['asset_id'] = assetID;
                currItem['attribute_name'] = attributeName;
                currItem['attribute_value'] = attributeValue;
                currItem['change_date'] = parsedMsg.last_updated || currDate;
                currItem['location_change'] = true;
                currItem['status_change'] = false;
                currItem['asset_type'] = parsedMsg.type;
                assetHistoryItems.push(currItem);
            }
        }
        logger.publishLog(global_config_1.LogLevels.DEBUG, 'StandardKeys Parsed Data: ', assetHistoryItems);
        return assetHistoryItems;
    }
    function createCustomHistoryData(assetID, parsedMsg) {
        var customData = parsedMsg['custom_data'];
        if (CUSTOM_DATA_KEY_STORAGE_SETTING === global_config_1.KeyStorageSettings.NO ||
            (CUSTOM_DATA_KEY_STORAGE_SETTING === global_config_1.KeyStorageSettings.CUSTOM &&
                CUSTOM_DATA_KEYS_TO_STORE &&
                CUSTOM_DATA_KEYS_TO_STORE.length <= 0)) {
            return [];
        }
        if (!customData) {
            logger.publishLog(global_config_1.LogLevels.DEBUG, 'Custom Data Missing: ', customData);
            return [];
        }
        var historyData = [];
        var currDate = new Date().toISOString();
        var keysToStore = CUSTOM_DATA_KEY_STORAGE_SETTING === global_config_1.KeyStorageSettings.ALL
            ? Object.keys(customData)
            : CUSTOM_DATA_KEYS_TO_STORE;
        for (var _i = 0, keysToStore_1 = keysToStore; _i < keysToStore_1.length; _i++) {
            var key = keysToStore_1[_i];
            if (key) {
                historyData.push(__assign(__assign({}, getEmptyAssetHistoryObject()), { change_date: parsedMsg.last_updated || currDate, attribute_name: key, asset_id: assetID, attribute_value: customData[key], location_change: false, status_change: true, asset_type: parsedMsg.type }));
            }
        }
        return historyData;
    }
    function HandleMessage(err, msg, topic) {
        if (err) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '  ' + topic);
        }
        var parsedMsg;
        try {
            parsedMsg = JSON.parse(msg);
        }
        catch (e) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Failed parse the message: ', e.message);
            return;
        }
        var assetHistoryItems = [];
        var assetID = '';
        if (parsedMsg['id']) {
            assetID = parsedMsg['id'];
        }
        if (!assetID) {
            logger.publishLog(global_config_1.LogLevels.ERROR, 'Invalid message received, key: id missing in the payload ', topic, parsedMsg);
            resp.error('Invalid message received, key: id missing in the payload ' + topic);
        }
        var standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
        assetHistoryItems = assetHistoryItems.concat(standardHistoryData);
        assetHistoryItems = assetHistoryItems.concat(createCustomHistoryData(assetID, parsedMsg));
        logger.publishLog(global_config_1.LogLevels.DEBUG, 'HistoryData ', assetHistoryItems);
        if (assetHistoryItems.length < 1) {
            logger.publishLog(global_config_1.LogLevels.DEBUG, 'No data to store for asset-history');
            return;
        }
        var assetHistoyCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_HISTORY);
        assetHistoyCol
            .cbCreatePromise({ item: assetHistoryItems })
            .then(successCb, failureCb);
        Promise.runQueue();
    }
    function WaitLoop() {
        logger.publishLog(global_config_1.LogLevels.INFO, 'Subscribed to Shared Topics. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(TOPICS, HandleMessage);
        }
    }
    Normalizer_1.bulkSubscriber(TOPICS)
        .then(function () {
        WaitLoop();
    })
        .catch(function (e) {
        log("Subscription error: " + e.message);
        resp.error("Subscription error: " + e.message);
    });
    Promise.runQueue();
}
exports.createAssetHistorySS = createAssetHistorySS;
