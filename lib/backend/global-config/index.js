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
})(CollectionName = exports.CollectionName || (exports.CollectionName = {}));
var AssetStatusUpdateMethod;
(function (AssetStatusUpdateMethod) {
    AssetStatusUpdateMethod["OVERWRITE"] = "overwrite";
    AssetStatusUpdateMethod["MERGE"] = "merge";
})(AssetStatusUpdateMethod = exports.AssetStatusUpdateMethod || (exports.AssetStatusUpdateMethod = {}));
var globalConfig = {
    LOG_LEVEL: {
        INFO: LogLevels.INFO,
        DEBUG: LogLevels.DEBUG,
        ERROR: LogLevels.ERROR,
        SUCCESS: LogLevels.SUCCESS,
    },
    LOG_SETTING: LogLevels.DEBUG,
    CUSTOM_CONFIGS: {},
    ASSET_HISTORY_CONFIG: ['location_x', 'location_y', 'location_z'],
    NORMALIZER_PUB_CONFIG: {
        locationConfig: {
            topicFn: Util_1.Topics.DBUpdateAssetLocation,
            keysToPublish: [
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
            keysToPublish: ['custom_data', 'type'],
        },
        historyConfig: {
            topicFn: Util_1.Topics.AssetHistory,
            keysToPublish: [
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
        LOG_SETTING: LogLevels.DEBUG,
        CREATE_NEW_ASSET_IF_MISSING: false,
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
