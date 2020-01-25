"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../Util");
var LogLevels;
(function (LogLevels) {
    LogLevels["INFO"] = "info";
    LogLevels["DEBUG"] = "debug";
    LogLevels["ERROR"] = "error";
    LogLevels["SUCCESS"] = "success";
})(LogLevels = exports.LogLevels || (exports.LogLevels = {}));
var CollectionName;
(function (CollectionName) {
    CollectionName["ASSETS"] = "assets";
    CollectionName["ASSET_HISTORY"] = "asset_history";
    CollectionName["ASSET_TYPES"] = "asset_types";
    CollectionName["AREAS"] = "areas";
    CollectionName["ACTIONS"] = "actions";
    CollectionName["EVENT_TYPES"] = "event_types";
    CollectionName["EVENTS"] = "events";
    CollectionName["EVENT_HISTORY"] = "event_history";
})(CollectionName = exports.CollectionName || (exports.CollectionName = {}));
var AssetStatusUpdateMethod;
(function (AssetStatusUpdateMethod) {
    AssetStatusUpdateMethod["OVERWRITE"] = "overwrite";
    AssetStatusUpdateMethod["MERGE"] = "merge";
})(AssetStatusUpdateMethod = exports.AssetStatusUpdateMethod || (exports.AssetStatusUpdateMethod = {}));
var KeyStorageSettings;
(function (KeyStorageSettings) {
    KeyStorageSettings["NO"] = "no";
    KeyStorageSettings["ALL"] = "all";
    KeyStorageSettings["CUSTOM"] = "custom";
})(KeyStorageSettings = exports.KeyStorageSettings || (exports.KeyStorageSettings = {}));
var globalConfig = {
    LOG_LEVEL: {
        INFO: LogLevels.INFO,
        DEBUG: LogLevels.DEBUG,
        ERROR: LogLevels.ERROR,
        SUCCESS: LogLevels.SUCCESS,
    },
    LOG_SETTING: LogLevels.DEBUG,
    CUSTOM_CONFIGS: {},
    ASSET_HISTORY_CONFIG: {
        STANDARD_KEYS_TO_STORE: ['location_x', 'location_y', 'location_z'],
        CUSTOM_DATA_KEYS_TO_STORE: [],
        LOG_SETTING: LogLevels.DEBUG,
        STANDARD_KEY_STORAGE_SETTING: KeyStorageSettings.CUSTOM,
        CUSTOM_DATA_KEY_STORAGE_SETTING: KeyStorageSettings.ALL,
    },
    NORMALIZER_PUB_CONFIG: {
        locationConfig: {
            topicFn: Util_1.Topics.DBUpdateAssetLocation,
            keysToPublish: [
                'id',
                'location_x',
                'location_y',
                'location_z',
                'location_unit',
                'location_type',
                'latitude',
                'longitude',
                'last_updated',
                'last_location_updated',
            ],
        },
        statusConfig: {
            topicFn: Util_1.Topics.DBUpdateAssetStatus,
            keysToPublish: ['custom_data', 'id', 'type'],
        },
        historyConfig: {
            topicFn: Util_1.Topics.AssetHistory,
            keysToPublish: [
                'id',
                'location_x',
                'location_y',
                'location_z',
                'location_unit',
                'location_type',
                'latitude',
                'longitude',
                'last_updated',
                'last_location_updated',
                'custom_data',
                'type',
            ],
        },
        rulesConfig: {
            topicFn: Util_1.Topics.RulesAssetLocation,
            keysToPublish: [
                'id',
                'location_x',
                'location_y',
                'location_z',
                'location_unit',
                'location_type',
                'latitude',
                'longitude',
                'last_updated',
                'last_location_updated',
                'custom_data',
                'type',
            ],
        },
    },
    UPDATE_ASSET_LOCATION_OPTIONS: {
        KEYS_TO_UPDATE: [
            'location_x',
            'location_y',
            'location_z',
            'location_unit',
            'location_type',
            'latitude',
            'longitude',
            'last_updated',
            'last_location_updated',
        ],
        CREATE_NEW_ASSET_IF_MISSING: false,
        LOG_SETTING: LogLevels.DEBUG,
    },
    UPDATE_ASSET_STATUS_OPTIONS: {
        UPDATE_METHOD: AssetStatusUpdateMethod.MERGE,
        LOG_SETTING: LogLevels.DEBUG,
    },
};
function CreateConfig(config) {
    globalConfig.CUSTOM_CONFIGS = config;
    return globalConfig;
}
exports.CreateConfig = CreateConfig;
//globalConfig = CreateConfig(customConfig);
exports.GC = globalConfig;
